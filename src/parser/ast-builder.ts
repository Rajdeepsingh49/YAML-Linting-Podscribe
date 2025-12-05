/**
 * Fault-Tolerant AST Builder for YAML
 * 
 * Builds a complete Abstract Syntax Tree from broken YAML by:
 * - Parsing line-by-line with try-catch at node level
 * - Marking broken nodes but continuing to parse rest of file
 * - Preserving complete file structure even with errors
 */

import type {
    ASTNode,
    MapNode,
    SequenceNode,
    ScalarNode,
    BrokenNode,
    DocumentNode,
    RootNode,
    ParseState,
    NodeDiagnostic,
    Token,
    TokenType,
    ASTAnalysis,
    TraversalOptions,
    TraversalCallback
} from './ast-types.js';

// ==========================================
// CONSTANTS
// ==========================================

const KNOWN_K8S_KEYS = new Set([
    'apiVersion', 'kind', 'metadata', 'spec', 'status', 'data', 'stringData',
    'name', 'namespace', 'labels', 'annotations', 'generateName',
    'replicas', 'selector', 'template', 'strategy', 'minReadySeconds',
    'containers', 'initContainers', 'volumes', 'volumeMounts', 'volumeClaimTemplates',
    'image', 'imagePullPolicy', 'command', 'args', 'env', 'envFrom',
    'ports', 'containerPort', 'protocol', 'hostPort', 'name',
    'resources', 'limits', 'requests', 'cpu', 'memory',
    'livenessProbe', 'readinessProbe', 'startupProbe', 'httpGet', 'tcpSocket', 'exec',
    'path', 'port', 'scheme', 'initialDelaySeconds', 'periodSeconds', 'timeoutSeconds',
    'successThreshold', 'failureThreshold',
    'securityContext', 'runAsUser', 'runAsGroup', 'fsGroup', 'privileged', 'readOnlyRootFilesystem',
    'serviceAccountName', 'serviceAccount', 'automountServiceAccountToken',
    'nodeSelector', 'affinity', 'tolerations', 'nodeName',
    'restartPolicy', 'terminationGracePeriodSeconds', 'dnsPolicy', 'hostNetwork', 'hostPID',
    'configMap', 'secret', 'persistentVolumeClaim', 'emptyDir', 'hostPath',
    'claimName', 'secretName', 'configMapName', 'key', 'optional',
    'matchLabels', 'matchExpressions', 'operator', 'values',
    'type', 'clusterIP', 'externalIPs', 'loadBalancerIP', 'sessionAffinity',
    'targetPort', 'nodePort',
    'rules', 'host', 'http', 'paths', 'backend', 'serviceName', 'servicePort',
    'tls', 'secretName', 'hosts',
    'schedule', 'concurrencyPolicy', 'suspend', 'startingDeadlineSeconds',
    'successfulJobsHistoryLimit', 'failedJobsHistoryLimit',
    'completions', 'parallelism', 'backoffLimit', 'activeDeadlineSeconds',
    'accessModes', 'storageClassName', 'volumeMode', 'capacity', 'storage',
    'roleRef', 'subjects', 'apiGroup', 'verbs', 'resourceNames',
]);

// ==========================================
// AST BUILDER CLASS
// ==========================================

export class ASTBuilder {
    private state: ParseState;
    private lines: string[];
    private root: RootNode;

    constructor() {
        this.state = this.initializeState();
        this.lines = [];
        this.root = this.createRootNode();
    }

    /**
     * Build AST from YAML content
     */
    build(content: string): RootNode {
        this.lines = content.split('\n');
        this.state = this.initializeState();
        this.root = this.createRootNode();
        this.root.totalLines = this.lines.length;

        let currentDocument: DocumentNode | null = null;
        let documentContent: ASTNode | null = null;
        let inMultiLineValue = false;
        let multiLineIndent = 0;
        let multiLineBuffer: string[] = [];
        let multiLineStartNode: ScalarNode | null = null;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const lineNumber = i + 1;
            this.state.currentLine = lineNumber;

            try {
                // Handle document separators
                if (line.trim() === '---') {
                    // Finish previous document
                    if (currentDocument) {
                        currentDocument.content = documentContent;
                        currentDocument.endLineNumber = lineNumber - 1;
                        this.root.documents.push(currentDocument);
                    }

                    // Start new document
                    currentDocument = this.createDocumentNode(lineNumber, this.state.documentIndex++);
                    currentDocument.hasExplicitStart = true;
                    documentContent = null;
                    this.state.nodeStack = [];
                    continue;
                }

                if (line.trim() === '...') {
                    if (currentDocument) {
                        currentDocument.hasExplicitEnd = true;
                        currentDocument.content = documentContent;
                        currentDocument.endLineNumber = lineNumber;
                        this.root.documents.push(currentDocument);
                        currentDocument = null;
                        documentContent = null;
                    }
                    continue;
                }

                // Start implicit first document if needed
                if (!currentDocument && line.trim() !== '') {
                    currentDocument = this.createDocumentNode(lineNumber, this.state.documentIndex++);
                }

                // Handle multi-line values
                if (inMultiLineValue) {
                    const lineIndent = this.getIndent(line);
                    if (line.trim() === '' || lineIndent > multiLineIndent) {
                        multiLineBuffer.push(line);
                        continue;
                    } else {
                        // End of multi-line value
                        if (multiLineStartNode) {
                            multiLineStartNode.value = multiLineBuffer.join('\n');
                            multiLineStartNode.endLineNumber = lineNumber - 1;
                        }
                        inMultiLineValue = false;
                        multiLineBuffer = [];
                        multiLineStartNode = null;
                    }
                }

                // Skip empty lines and comments (but preserve them)
                if (line.trim() === '' || line.trim().startsWith('#')) {
                    continue;
                }

                // Parse the line
                const parseResult = this.parseLine(line, lineNumber);

                if (!parseResult.node) {
                    continue;
                }

                // Check for multi-line value start (| or >)
                if (parseResult.node.type === 'scalar') {
                    const scalarNode = parseResult.node as ScalarNode;
                    if (scalarNode.value === '|' || scalarNode.value === '>') {
                        inMultiLineValue = true;
                        multiLineIndent = this.getIndent(line);
                        multiLineStartNode = scalarNode;
                        multiLineBuffer = [];
                    }
                }

                // Integrate node into tree
                if (!documentContent) {
                    documentContent = parseResult.node;
                    if (parseResult.node.type === 'map') {
                        this.state.nodeStack = [parseResult.node];
                    }
                } else {
                    this.integrateNode(parseResult.node, documentContent);
                }

            } catch (error) {
                // Create broken node for unparseable line
                const brokenNode = this.createBrokenNode(line, lineNumber, error);

                if (!documentContent) {
                    documentContent = brokenNode;
                } else if (documentContent.type === 'map') {
                    (documentContent as MapNode).children.set(`__broken_${lineNumber}`, brokenNode);
                    (documentContent as MapNode).keyOrder.push(`__broken_${lineNumber}`);
                }
            }
        }

        // Finish last document
        if (currentDocument) {
            currentDocument.content = documentContent;
            currentDocument.endLineNumber = this.lines.length;
            this.root.documents.push(currentDocument);
        }

        // If no explicit documents, create implicit one
        if (this.root.documents.length === 0 && documentContent) {
            const implicitDoc = this.createDocumentNode(1, 0);
            implicitDoc.content = documentContent;
            implicitDoc.endLineNumber = this.lines.length;
            this.root.documents.push(implicitDoc);
        }

        this.root.endLineNumber = this.lines.length;
        return this.root;
    }

    /**
     * Parse a single line into an AST node
     */
    private parseLine(line: string, lineNumber: number): { node: ASTNode | null; diagnostics: NodeDiagnostic[] } {
        const diagnostics: NodeDiagnostic[] = [];
        const indent = this.getIndent(line);
        const trimmed = line.trim();

        // Skip empty and comment lines
        if (trimmed === '' || trimmed.startsWith('#')) {
            return { node: null, diagnostics };
        }

        // Check for list item
        const isListItem = trimmed.startsWith('- ') || trimmed === '-';
        let content = isListItem ? trimmed.substring(2).trim() : trimmed;

        // Tokenize the content
        const tokens = this.tokenize(content, lineNumber);

        // Handle different cases
        if (tokens.length === 0) {
            return { node: null, diagnostics };
        }

        // Check for key-value pair
        const colonIndex = content.indexOf(':');

        if (colonIndex > 0) {
            const key = content.substring(0, colonIndex).trim();
            const valueStr = content.substring(colonIndex + 1).trim();

            // Create map node for key-value
            if (valueStr === '' || valueStr.startsWith('#')) {
                // Key with no inline value (expects children)
                const mapNode = this.createMapNode(lineNumber, indent, key);
                mapNode.key = key;
                return { node: mapNode, diagnostics };
            } else if (valueStr === '|' || valueStr === '>') {
                // Multi-line string marker
                const scalarNode = this.createScalarNode(lineNumber, indent, valueStr);
                scalarNode.key = key;
                return { node: scalarNode, diagnostics };
            } else {
                // Inline value
                const scalarNode = this.createScalarNode(lineNumber, indent, this.parseScalarValue(valueStr));
                scalarNode.key = key;
                return { node: scalarNode, diagnostics };
            }
        } else if (colonIndex === -1 && !isListItem) {
            // Possible missing colon - check if it looks like a key-value
            const spaceIndex = content.indexOf(' ');
            if (spaceIndex > 0) {
                const potentialKey = content.substring(0, spaceIndex);
                const potentialValue = content.substring(spaceIndex + 1).trim();

                if (KNOWN_K8S_KEYS.has(potentialKey) || this.looksLikeKey(potentialKey)) {
                    // This looks like a missing colon situation
                    diagnostics.push({
                        severity: 'error',
                        message: `Missing colon after key "${potentialKey}"`,
                        code: 'MISSING_COLON',
                        line: lineNumber,
                        column: spaceIndex,
                        fixable: true,
                        fix: {
                            description: `Add colon after "${potentialKey}"`,
                            replacement: `${potentialKey}: ${potentialValue}`
                        }
                    });

                    // Create node with the detected structure
                    const scalarNode = this.createScalarNode(lineNumber, indent, this.parseScalarValue(potentialValue));
                    scalarNode.key = potentialKey;
                    scalarNode.isValid = false;
                    scalarNode.diagnostics = diagnostics;
                    return { node: scalarNode, diagnostics };
                }
            }

            // Plain scalar value
            const scalarNode = this.createScalarNode(lineNumber, indent, this.parseScalarValue(content));
            return { node: scalarNode, diagnostics };
        }

        if (isListItem) {
            // Handle list item
            if (content === '' || content === '-') {
                // Empty list item or list of nested items
                const seqNode = this.createSequenceNode(lineNumber, indent);
                return { node: seqNode, diagnostics };
            }

            // List item with value
            const itemColonIndex = content.indexOf(':');
            if (itemColonIndex > 0) {
                // List item with key-value
                const key = content.substring(0, itemColonIndex).trim();
                const valueStr = content.substring(itemColonIndex + 1).trim();

                const mapNode = this.createMapNode(lineNumber, indent + 2, key);
                mapNode.key = key;

                if (valueStr !== '' && !valueStr.startsWith('#')) {
                    const scalarNode = this.createScalarNode(lineNumber, indent + 2, this.parseScalarValue(valueStr));
                    scalarNode.key = key;
                    mapNode.children.set(key, scalarNode);
                    mapNode.keyOrder.push(key);
                }

                return { node: mapNode, diagnostics };
            } else {
                // Plain list item value
                const scalarNode = this.createScalarNode(lineNumber, indent, this.parseScalarValue(content));
                return { node: scalarNode, diagnostics };
            }
        }

        return { node: null, diagnostics };
    }

    /**
     * Integrate a node into the tree based on indentation
     */
    private integrateNode(node: ASTNode, root: ASTNode): void {
        if (root.type !== 'map') {
            return;
        }

        const rootMap = root as MapNode;
        const nodeIndent = node.indent;

        // Find the correct parent based on indentation
        let parent: MapNode = rootMap;

        // Walk up the stack to find the right parent
        for (let i = this.state.nodeStack.length - 1; i >= 0; i--) {
            const stackNode = this.state.nodeStack[i];
            if (stackNode.type === 'map' && stackNode.indent < nodeIndent) {
                parent = stackNode as MapNode;
                // Trim the stack to this level
                this.state.nodeStack = this.state.nodeStack.slice(0, i + 1);
                break;
            }
        }

        // Set parent reference
        node.parent = parent;
        node.path = [...parent.path, node.key || String(parent.keyOrder.length)];

        // Add to parent
        if (node.key) {
            parent.children.set(node.key, node);
            parent.keyOrder.push(node.key);
        } else {
            const autoKey = `__item_${parent.keyOrder.length}`;
            parent.children.set(autoKey, node);
            parent.keyOrder.push(autoKey);
        }

        // Add to stack if it's a map (can have children)
        if (node.type === 'map') {
            this.state.nodeStack.push(node);
        }
    }

    /**
     * Tokenize a line content
     */
    private tokenize(content: string, lineNumber: number): Token[] {
        const tokens: Token[] = [];
        let pos = 0;

        while (pos < content.length) {
            const char = content[pos];

            // Skip whitespace
            if (char === ' ' || char === '\t') {
                const start = pos;
                while (pos < content.length && (content[pos] === ' ' || content[pos] === '\t')) {
                    pos++;
                }
                tokens.push({ type: 'whitespace', value: content.slice(start, pos), line: lineNumber, column: start, length: pos - start });
                continue;
            }

            // Check for special characters
            if (char === ':') {
                tokens.push({ type: 'colon', value: ':', line: lineNumber, column: pos, length: 1 });
                pos++;
                continue;
            }

            if (char === '-' && (pos === 0 || content[pos - 1] === ' ')) {
                const nextChar = content[pos + 1];
                if (nextChar === ' ' || nextChar === undefined || nextChar === '\n') {
                    tokens.push({ type: 'listMarker', value: '-', line: lineNumber, column: pos, length: 1 });
                    pos++;
                    continue;
                }
            }

            if (char === '#') {
                tokens.push({ type: 'comment', value: content.slice(pos), line: lineNumber, column: pos, length: content.length - pos });
                break;
            }

            if (char === '&') {
                const start = pos;
                pos++;
                while (pos < content.length && /[\w_-]/.test(content[pos])) {
                    pos++;
                }
                tokens.push({ type: 'anchor', value: content.slice(start, pos), line: lineNumber, column: start, length: pos - start });
                continue;
            }

            if (char === '*') {
                const start = pos;
                pos++;
                while (pos < content.length && /[\w_-]/.test(content[pos])) {
                    pos++;
                }
                tokens.push({ type: 'alias', value: content.slice(start, pos), line: lineNumber, column: start, length: pos - start });
                continue;
            }

            if (char === '{') {
                tokens.push({ type: 'flowMapStart', value: '{', line: lineNumber, column: pos, length: 1 });
                pos++;
                continue;
            }

            if (char === '}') {
                tokens.push({ type: 'flowMapEnd', value: '}', line: lineNumber, column: pos, length: 1 });
                pos++;
                continue;
            }

            if (char === '[') {
                tokens.push({ type: 'flowSeqStart', value: '[', line: lineNumber, column: pos, length: 1 });
                pos++;
                continue;
            }

            if (char === ']') {
                tokens.push({ type: 'flowSeqEnd', value: ']', line: lineNumber, column: pos, length: 1 });
                pos++;
                continue;
            }

            // Quoted strings
            if (char === '"' || char === "'") {
                const quote = char;
                const start = pos;
                pos++;
                while (pos < content.length && content[pos] !== quote) {
                    if (content[pos] === '\\' && pos + 1 < content.length) {
                        pos++; // Skip escaped char
                    }
                    pos++;
                }
                if (pos < content.length) {
                    pos++; // Skip closing quote
                }
                tokens.push({ type: 'value', value: content.slice(start, pos), line: lineNumber, column: start, length: pos - start });
                continue;
            }

            // Regular word/value
            const start = pos;
            while (pos < content.length && !/[\s:#{}\[\]]/.test(content[pos])) {
                pos++;
            }
            if (pos > start) {
                const value = content.slice(start, pos);
                const tokenType: TokenType = tokens.length === 0 || tokens[tokens.length - 1].type === 'listMarker' ? 'key' : 'value';
                tokens.push({ type: tokenType, value, line: lineNumber, column: start, length: pos - start });
            }
        }

        return tokens;
    }

    /**
     * Parse a scalar value string into its typed value
     */
    private parseScalarValue(value: string): string | number | boolean | null {
        const trimmed = value.trim();

        // Remove quotes if present
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
        }

        // Check for null
        if (trimmed === 'null' || trimmed === '~' || trimmed === '') {
            return null;
        }

        // Check for boolean
        if (/^(true|yes|on)$/i.test(trimmed)) {
            return true;
        }
        if (/^(false|no|off)$/i.test(trimmed)) {
            return false;
        }

        // Check for number
        if (/^-?\d+$/.test(trimmed)) {
            return parseInt(trimmed, 10);
        }
        if (/^-?\d*\.\d+$/.test(trimmed)) {
            return parseFloat(trimmed);
        }

        // Return as string
        return trimmed;
    }

    /**
     * Check if a string looks like a YAML key
     */
    private looksLikeKey(str: string): boolean {
        // Must be alphanumeric with optional hyphens/underscores
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(str)) {
            return false;
        }
        // Common patterns for K8s keys
        if (str.length > 30) {
            return false;
        }
        return true;
    }

    /**
     * Get indentation of a line
     */
    private getIndent(line: string): number {
        const match = line.match(/^(\s*)/);
        if (!match) return 0;

        let indent = 0;
        for (const char of match[1]) {
            if (char === '\t') {
                indent += 2; // Treat tabs as 2 spaces
            } else {
                indent++;
            }
        }
        return indent;
    }

    // ==========================================
    // NODE FACTORY METHODS
    // ==========================================

    private initializeState(): ParseState {
        return {
            currentLine: 0,
            currentIndent: 0,
            nodeStack: [],
            diagnostics: [],
            nodeIdCounter: 0,
            inMultiLineString: false,
            documentIndex: 0
        };
    }

    private generateId(): string {
        return `node_${this.state.nodeIdCounter++}`;
    }

    private createRootNode(): RootNode {
        return {
            id: this.generateId(),
            type: 'root',
            lineNumber: 1,
            endLineNumber: 1,
            indent: 0,
            parent: null,
            originalText: '',
            isValid: true,
            path: [],
            diagnostics: [],
            documents: [],
            totalLines: 0,
            fileDiagnostics: []
        };
    }

    private createDocumentNode(lineNumber: number, documentIndex: number): DocumentNode {
        return {
            id: this.generateId(),
            type: 'document',
            lineNumber,
            endLineNumber: lineNumber,
            indent: 0,
            parent: this.root,
            originalText: '',
            isValid: true,
            path: [`doc_${documentIndex}`],
            diagnostics: [],
            content: null,
            documentIndex,
            hasExplicitStart: false,
            hasExplicitEnd: false
        };
    }

    private createMapNode(lineNumber: number, indent: number, key?: string): MapNode {
        return {
            id: this.generateId(),
            type: 'map',
            lineNumber,
            endLineNumber: lineNumber,
            indent,
            parent: null,
            originalText: this.lines[lineNumber - 1] || '',
            isValid: true,
            key,
            path: [],
            diagnostics: [],
            children: new Map(),
            keyOrder: []
        };
    }

    private createSequenceNode(lineNumber: number, indent: number): SequenceNode {
        return {
            id: this.generateId(),
            type: 'sequence',
            lineNumber,
            endLineNumber: lineNumber,
            indent,
            parent: null,
            originalText: this.lines[lineNumber - 1] || '',
            isValid: true,
            path: [],
            diagnostics: [],
            children: []
        };
    }

    private createScalarNode(lineNumber: number, indent: number, value: string | number | boolean | null): ScalarNode {
        const originalType: 'string' | 'number' | 'boolean' | 'null' =
            value === null ? 'null' :
                typeof value === 'boolean' ? 'boolean' :
                    typeof value === 'number' ? 'number' : 'string';

        return {
            id: this.generateId(),
            type: 'scalar',
            lineNumber,
            endLineNumber: lineNumber,
            indent,
            parent: null,
            originalText: this.lines[lineNumber - 1] || '',
            isValid: true,
            path: [],
            diagnostics: [],
            value,
            originalType,
            isFlow: false
        };
    }

    private createBrokenNode(line: string, lineNumber: number, error: unknown): BrokenNode {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
            id: this.generateId(),
            type: 'broken',
            lineNumber,
            endLineNumber: lineNumber,
            indent: this.getIndent(line),
            parent: null,
            originalText: line,
            isValid: false,
            path: [],
            diagnostics: [{
                severity: 'error',
                message: errorMessage,
                code: 'PARSE_ERROR',
                line: lineNumber,
                fixable: false
            }],
            error: errorMessage
        };
    }

    // ==========================================
    // TREE TRAVERSAL & ANALYSIS
    // ==========================================

    /**
     * Traverse the AST
     */
    static traverse(root: RootNode, callback: TraversalCallback, options: TraversalOptions = {}): void {
        const { includeBroken = true, maxDepth = -1, includeTypes, postOrder = false } = options;

        const visit = (node: ASTNode, depth: number, path: string[]): boolean => {
            // Check depth limit
            if (maxDepth >= 0 && depth > maxDepth) {
                return true;
            }

            // Check type filter
            if (includeTypes && !includeTypes.includes(node.type)) {
                return true;
            }

            // Skip broken if not included
            if (!includeBroken && node.type === 'broken') {
                return true;
            }

            // Pre-order callback
            if (!postOrder) {
                const result = callback(node, depth, path);
                if (result === false) return false;
            }

            // Visit children
            if (node.type === 'root') {
                for (const doc of (node as RootNode).documents) {
                    if (!visit(doc, depth + 1, [...path, `doc_${doc.documentIndex}`])) {
                        return false;
                    }
                }
            } else if (node.type === 'document') {
                const content = (node as DocumentNode).content;
                if (content) {
                    if (!visit(content, depth + 1, path)) {
                        return false;
                    }
                }
            } else if (node.type === 'map') {
                const mapNode = node as MapNode;
                for (const key of mapNode.keyOrder) {
                    const child = mapNode.children.get(key);
                    if (child) {
                        if (!visit(child, depth + 1, [...path, key])) {
                            return false;
                        }
                    }
                }
            } else if (node.type === 'sequence') {
                const seqNode = node as SequenceNode;
                for (let i = 0; i < seqNode.children.length; i++) {
                    if (!visit(seqNode.children[i], depth + 1, [...path, String(i)])) {
                        return false;
                    }
                }
            }

            // Post-order callback
            if (postOrder) {
                const result = callback(node, depth, path);
                if (result === false) return false;
            }

            return true;
        };

        visit(root, 0, []);
    }

    /**
     * Analyze the AST structure
     */
    static analyze(root: RootNode): ASTAnalysis {
        const nodeCounts: Record<ASTNode['type'], number> = {
            root: 0,
            document: 0,
            map: 0,
            sequence: 0,
            scalar: 0,
            broken: 0
        };
        let maxDepth = 0;
        let brokenNodeCount = 0;
        const allDiagnostics: NodeDiagnostic[] = [...root.fileDiagnostics];
        let detectedKind: string | undefined;
        let detectedApiVersion: string | undefined;

        this.traverse(root, (node, depth) => {
            nodeCounts[node.type]++;
            maxDepth = Math.max(maxDepth, depth);

            if (node.type === 'broken') {
                brokenNodeCount++;
            }

            allDiagnostics.push(...node.diagnostics);

            // Detect K8s kind and apiVersion
            if (node.type === 'scalar' && node.key === 'kind' && typeof node.value === 'string') {
                detectedKind = node.value;
            }
            if (node.type === 'scalar' && node.key === 'apiVersion' && typeof node.value === 'string') {
                detectedApiVersion = node.value;
            }
        });

        return {
            nodeCounts,
            maxDepth,
            brokenNodeCount,
            allDiagnostics,
            detectedKind,
            detectedApiVersion,
            structureValid: brokenNodeCount === 0
        };
    }

    /**
     * Find a node by path
     */
    static findByPath(root: RootNode, path: string[]): ASTNode | null {
        let current: ASTNode = root;

        for (const segment of path) {
            if (current.type === 'root') {
                const docMatch = segment.match(/^doc_(\d+)$/);
                if (docMatch) {
                    const docIndex = parseInt(docMatch[1], 10);
                    const doc: DocumentNode | undefined = (current as RootNode).documents[docIndex];
                    if (!doc) return null;
                    current = doc;
                    continue;
                }
            }

            if (current.type === 'document') {
                const content: ASTNode | null = (current as DocumentNode).content;
                if (!content) return null;
                current = content;
            }

            if (current.type === 'map') {
                const child = (current as MapNode).children.get(segment);
                if (!child) return null;
                current = child;
            } else if (current.type === 'sequence') {
                // Array index
                const index = parseInt(segment, 10);
                if (isNaN(index)) return null;

                const child: ASTNode | undefined = (current as SequenceNode).children[index];
                if (!child) return null;
                current = child;
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Serialize AST back to YAML
     */
    static serialize(root: RootNode, indentSize: number = 2): string {
        const lines: string[] = [];

        for (let i = 0; i < root.documents.length; i++) {
            const doc = root.documents[i];

            if (i > 0 || doc.hasExplicitStart) {
                lines.push('---');
            }

            if (doc.content) {
                this.serializeNode(doc.content, 0, lines, indentSize);
            }

            if (doc.hasExplicitEnd) {
                lines.push('...');
            }
        }

        return lines.join('\n');
    }

    private static serializeNode(node: ASTNode, indent: number, lines: string[], indentSize: number): void {
        const prefix = ' '.repeat(indent);

        if (node.type === 'scalar') {
            const scalarNode = node as ScalarNode;
            let valueStr: string;

            if (scalarNode.value === null) {
                valueStr = 'null';
            } else if (typeof scalarNode.value === 'boolean') {
                valueStr = scalarNode.value ? 'true' : 'false';
            } else if (typeof scalarNode.value === 'number') {
                valueStr = String(scalarNode.value);
            } else {
                valueStr = String(scalarNode.value);
                // Quote if needed
                if (valueStr.includes(':') || valueStr.includes('#') || valueStr.startsWith(' ') || valueStr.endsWith(' ')) {
                    valueStr = `"${valueStr.replace(/"/g, '\\"')}"`;
                }
            }

            if (scalarNode.key) {
                lines.push(`${prefix}${scalarNode.key}: ${valueStr}`);
            } else {
                lines.push(`${prefix}${valueStr}`);
            }
        } else if (node.type === 'map') {
            const mapNode = node as MapNode;

            if (mapNode.key) {
                lines.push(`${prefix}${mapNode.key}:`);
            }

            for (const key of mapNode.keyOrder) {
                const child = mapNode.children.get(key);
                if (child && !key.startsWith('__')) {
                    this.serializeNode(child, mapNode.key ? indent + indentSize : indent, lines, indentSize);
                }
            }
        } else if (node.type === 'sequence') {
            const seqNode = node as SequenceNode;

            for (const child of seqNode.children) {
                lines.push(`${prefix}-`);
                this.serializeNode(child, indent + indentSize, lines, indentSize);
            }
        } else if (node.type === 'broken') {
            // Preserve broken content as comment
            lines.push(`${prefix}# BROKEN: ${node.originalText.trim()}`);
        }
    }
}

// Export singleton instance
export const astBuilder = new ASTBuilder();
