/**
 * AST Types for Fault-Tolerant YAML Parsing
 * 
 * Defines the Abstract Syntax Tree structure for representing YAML documents,
 * including support for broken/unparseable sections.
 */

// ==========================================
// AST NODE TYPES
// ==========================================

/**
 * Base interface for all AST nodes
 */
export interface ASTNodeBase {
    /** Unique identifier for this node */
    id: string;
    /** Node type discriminator */
    type: 'map' | 'sequence' | 'scalar' | 'broken' | 'document' | 'root';
    /** Line number in original file (1-indexed) */
    lineNumber: number;
    /** End line number (for multi-line nodes) */
    endLineNumber: number;
    /** Indentation level (number of spaces) */
    indent: number;
    /** Reference to parent node */
    parent: ASTNode | null;
    /** Original text from file */
    originalText: string;
    /** Whether this node is valid YAML */
    isValid: boolean;
    /** Optional key (for map entries) */
    key?: string;
    /** Path from root (e.g., ['spec', 'template', 'spec', 'containers', '0']) */
    path: string[];
    /** Any parsing warnings/errors for this node */
    diagnostics: NodeDiagnostic[];
}

/**
 * Map node - represents key-value pairs (YAML objects)
 */
export interface MapNode extends ASTNodeBase {
    type: 'map';
    /** Child entries as key-value pairs */
    children: Map<string, ASTNode>;
    /** Ordered list of keys (preserves insertion order) */
    keyOrder: string[];
}

/**
 * Sequence node - represents arrays/lists
 */
export interface SequenceNode extends ASTNodeBase {
    type: 'sequence';
    /** Child items in order */
    children: ASTNode[];
}

/**
 * Scalar node - represents primitive values
 */
export interface ScalarNode extends ASTNodeBase {
    type: 'scalar';
    /** The scalar value */
    value: string | number | boolean | null;
    /** Original value type before any coercion */
    originalType: 'string' | 'number' | 'boolean' | 'null';
    /** Quote style if string */
    quoteStyle?: 'single' | 'double' | 'none';
    /** Whether value was in flow style (inline) */
    isFlow: boolean;
}

/**
 * Broken node - represents unparseable sections
 */
export interface BrokenNode extends ASTNodeBase {
    type: 'broken';
    /** The parsing error that caused this */
    error: string;
    /** Best-guess children (may be partial) */
    partialChildren?: ASTNode[];
    /** Suggested fix if determinable */
    suggestedFix?: string;
}

/**
 * Document node - represents a single YAML document (between --- separators)
 */
export interface DocumentNode extends ASTNodeBase {
    type: 'document';
    /** The root content of this document */
    content: ASTNode | null;
    /** Document index in multi-document file */
    documentIndex: number;
    /** Whether document has explicit start marker (---) */
    hasExplicitStart: boolean;
    /** Whether document has explicit end marker (...) */
    hasExplicitEnd: boolean;
}

/**
 * Root node - represents the entire file
 */
export interface RootNode extends ASTNodeBase {
    type: 'root';
    /** All documents in the file */
    documents: DocumentNode[];
    /** Total line count */
    totalLines: number;
    /** File-level diagnostics */
    fileDiagnostics: NodeDiagnostic[];
}

/**
 * Union type for all AST nodes
 */
export type ASTNode = MapNode | SequenceNode | ScalarNode | BrokenNode | DocumentNode | RootNode;

// ==========================================
// DIAGNOSTIC TYPES
// ==========================================

/**
 * Severity levels for diagnostics
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

/**
 * Diagnostic information for a node
 */
export interface NodeDiagnostic {
    /** Severity level */
    severity: DiagnosticSeverity;
    /** Error/warning message */
    message: string;
    /** Error code (e.g., 'MISSING_COLON', 'INVALID_INDENT') */
    code: string;
    /** Line number where issue occurs */
    line: number;
    /** Column number where issue starts */
    column?: number;
    /** Length of the problematic section */
    length?: number;
    /** Whether this is automatically fixable */
    fixable: boolean;
    /** Suggested fix */
    fix?: {
        description: string;
        replacement: string;
    };
}

// ==========================================
// PARSING STATE TYPES
// ==========================================

/**
 * State maintained during parsing
 */
export interface ParseState {
    /** Current line being parsed */
    currentLine: number;
    /** Current indentation level */
    currentIndent: number;
    /** Stack of parent nodes */
    nodeStack: ASTNode[];
    /** All diagnostics collected during parsing */
    diagnostics: NodeDiagnostic[];
    /** Counter for generating unique node IDs */
    nodeIdCounter: number;
    /** Whether we're in a multi-line string */
    inMultiLineString: boolean;
    /** The type of multi-line string (| or >) */
    multiLineStringType?: 'literal' | 'folded';
    /** Current document index */
    documentIndex: number;
}

/**
 * Result of parsing a line
 */
export interface LineParseResult {
    /** Parsed node (may be partial) */
    node: ASTNode | null;
    /** Whether line was successfully parsed */
    success: boolean;
    /** Any diagnostics from this line */
    diagnostics: NodeDiagnostic[];
    /** Whether to continue to next line */
    continueToNext: boolean;
    /** Indent change from previous line */
    indentChange: 'same' | 'increase' | 'decrease' | 'reset';
}

/**
 * Token types for lexical analysis
 */
export type TokenType =
    | 'key'           // YAML key
    | 'colon'         // :
    | 'value'         // Scalar value
    | 'listMarker'    // - 
    | 'comment'       // # comment
    | 'anchor'        // &anchor
    | 'alias'         // *alias
    | 'tag'           // !tag
    | 'docStart'      // ---
    | 'docEnd'        // ...
    | 'flowMapStart'  // {
    | 'flowMapEnd'    // }
    | 'flowSeqStart'  // [
    | 'flowSeqEnd'    // ]
    | 'multiLineStart'// | or >
    | 'whitespace'
    | 'newline'
    | 'unknown';

/**
 * Token from lexical analysis
 */
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    length: number;
}

/**
 * Lexer result for a line
 */
export interface LexerResult {
    tokens: Token[];
    success: boolean;
    error?: string;
}

// ==========================================
// ANALYSIS TYPES
// ==========================================

/**
 * Result of analyzing the AST
 */
export interface ASTAnalysis {
    /** Total node count by type */
    nodeCounts: Record<ASTNode['type'], number>;
    /** Maximum nesting depth */
    maxDepth: number;
    /** Number of broken nodes */
    brokenNodeCount: number;
    /** All diagnostics from all nodes */
    allDiagnostics: NodeDiagnostic[];
    /** Detected Kubernetes kind (if applicable) */
    detectedKind?: string;
    /** Detected API version (if applicable) */
    detectedApiVersion?: string;
    /** Whether the document structure appears valid */
    structureValid: boolean;
}

/**
 * Options for AST traversal
 */
export interface TraversalOptions {
    /** Include broken nodes in traversal */
    includeBroken?: boolean;
    /** Maximum depth to traverse (-1 for unlimited) */
    maxDepth?: number;
    /** Specific node types to include */
    includeTypes?: ASTNode['type'][];
    /** Whether to traverse in pre-order (default) or post-order */
    postOrder?: boolean;
}

/**
 * Callback for AST traversal
 */
export type TraversalCallback = (
    node: ASTNode,
    depth: number,
    path: string[]
) => boolean | void; // Return false to stop traversal

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Position in the source file
 */
export interface Position {
    line: number;
    column: number;
}

/**
 * Range in the source file
 */
export interface Range {
    start: Position;
    end: Position;
}

/**
 * Factory functions for creating nodes
 */
export interface NodeFactory {
    createMap(props: Partial<MapNode>): MapNode;
    createSequence(props: Partial<SequenceNode>): SequenceNode;
    createScalar(props: Partial<ScalarNode>): ScalarNode;
    createBroken(props: Partial<BrokenNode>): BrokenNode;
    createDocument(props: Partial<DocumentNode>): DocumentNode;
    createRoot(props: Partial<RootNode>): RootNode;
}
