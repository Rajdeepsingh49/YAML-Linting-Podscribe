import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import yaml from 'js-yaml';
import validateRouter from './routes/validate.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/x-yaml' }));

// YAML Validator API Routes
app.use('/api/yaml', validateRouter);


// Helper: Check if a value exists
const exists = (val) => val !== undefined && val !== null && val !== '';

// Helper: Get line number from YAML
const getLineNumber = (yamlContent, fieldPath) => {
    const lines = yamlContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(fieldPath)) {
            return i + 1;
        }
    }
    return null;
};

// Security Checks for Containers
const validateContainerSecurity = (container, idx, yamlContent) => {
    const errors = [];

    // Check for privileged containers
    if (container.securityContext?.privileged === true) {
        errors.push({
            field: `containers[${idx}].securityContext.privileged`,
            message: 'SECURITY: Privileged containers can access host resources - use with caution',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'privileged')
        });
    }

    // Check for host network
    if (container.hostNetwork === true) {
        errors.push({
            field: `containers[${idx}].hostNetwork`,
            message: 'SECURITY: Host network mode bypasses network policies',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'hostNetwork')
        });
    }

    // Check for latest tag
    if (container.image && container.image.includes(':latest')) {
        errors.push({
            field: `containers[${idx}].image`,
            message: 'BEST PRACTICE: Avoid using :latest tag - specify explicit version',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'image')
        });
    }

    // Check for resource limits
    if (!container.resources || !container.resources.limits) {
        errors.push({
            field: `containers[${idx}].resources.limits`,
            message: 'BEST PRACTICE: Set resource limits to prevent resource exhaustion',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'resources')
        });
    }

    // Check for liveness/readiness probes
    if (!container.livenessProbe) {
        errors.push({
            field: `containers[${idx}].livenessProbe`,
            message: 'BEST PRACTICE: Add liveness probe for automatic restart on failure',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'containers')
        });
    }

    if (!container.readinessProbe) {
        errors.push({
            field: `containers[${idx}].readinessProbe`,
            message: 'BEST PRACTICE: Add readiness probe to control traffic routing',
            severity: 'warning',
            line: getLineNumber(yamlContent, 'containers')
        });
    }

    return errors;
};

// Validate common fields
const validateCommonFields = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.apiVersion)) {
        errors.push({
            field: 'apiVersion',
            message: "Missing required field 'apiVersion'",
            severity: 'error',
            line: getLineNumber(yamlContent, 'apiVersion')
        });
    }

    if (!exists(doc.kind)) {
        errors.push({
            field: 'kind',
            message: "Missing required field 'kind'",
            severity: 'error',
            line: getLineNumber(yamlContent, 'kind')
        });
    }

    if (!exists(doc.metadata)) {
        errors.push({
            field: 'metadata',
            message: "Missing required field 'metadata'",
            severity: 'error',
            line: getLineNumber(yamlContent, 'metadata')
        });
    } else {
        if (!exists(doc.metadata.name)) {
            errors.push({
                field: 'metadata.name',
                message: "Missing required field 'metadata.name'",
                severity: 'error',
                line: getLineNumber(yamlContent, 'name')
            });
        }

        // Best practice: Add labels
        if (!exists(doc.metadata.labels)) {
            errors.push({
                field: 'metadata.labels',
                message: "BEST PRACTICE: Add labels for better resource organization",
                severity: 'warning',
                line: getLineNumber(yamlContent, 'metadata')
            });
        }
    }

    return errors;
};

// Validate Deployment/StatefulSet/DaemonSet
const validateDeployment = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.spec)) {
        errors.push({
            field: 'spec',
            message: `${doc.kind} requires 'spec' field`,
            severity: 'error',
            line: getLineNumber(yamlContent, 'spec')
        });
        return errors;
    }

    const { spec } = doc;

    // Validate replicas
    if (exists(spec.replicas)) {
        if (typeof spec.replicas !== 'number') {
            errors.push({
                field: 'spec.replicas',
                message: "'replicas' must be a number",
                severity: 'error',
                line: getLineNumber(yamlContent, 'replicas')
            });
        } else if (spec.replicas < 1) {
            errors.push({
                field: 'spec.replicas',
                message: "BEST PRACTICE: Set replicas >= 2 for high availability",
                severity: 'warning',
                line: getLineNumber(yamlContent, 'replicas')
            });
        }
    }

    // Validate selector
    if (!exists(spec.selector)) {
        errors.push({
            field: 'spec.selector',
            message: `${doc.kind} spec requires 'selector' field`,
            severity: 'error',
            line: getLineNumber(yamlContent, 'selector')
        });
    } else if (!exists(spec.selector.matchLabels)) {
        errors.push({
            field: 'spec.selector.matchLabels',
            message: "Selector requires 'matchLabels' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'matchLabels')
        });
    }

    // Validate template
    if (!exists(spec.template)) {
        errors.push({
            field: 'spec.template',
            message: `${doc.kind} spec requires 'template' field`,
            severity: 'error',
            line: getLineNumber(yamlContent, 'template')
        });
        return errors;
    }

    if (!exists(spec.template.metadata)) {
        errors.push({
            field: 'spec.template.metadata',
            message: "Pod template requires 'metadata' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'template')
        });
    } else if (!exists(spec.template.metadata.labels)) {
        errors.push({
            field: 'spec.template.metadata.labels',
            message: "Pod template metadata requires 'labels' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'labels')
        });
    } else {
        // Validate label selector matches template labels
        if (spec.selector?.matchLabels) {
            const selectorLabels = Object.keys(spec.selector.matchLabels);
            const templateLabels = spec.template.metadata.labels;
            const missingLabels = selectorLabels.filter(key => !templateLabels[key]);

            if (missingLabels.length > 0) {
                errors.push({
                    field: 'spec.selector.matchLabels',
                    message: `Selector labels must match template labels. Missing: ${missingLabels.join(', ')}`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'matchLabels')
                });
            }
        }
    }

    if (!exists(spec.template.spec)) {
        errors.push({
            field: 'spec.template.spec',
            message: "Pod template requires 'spec' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'template')
        });
        return errors;
    }

    const podSpec = spec.template.spec;

    // Validate containers
    if (!exists(podSpec.containers)) {
        errors.push({
            field: 'spec.template.spec.containers',
            message: "Pod spec requires 'containers' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'containers')
        });
    } else if (!Array.isArray(podSpec.containers)) {
        errors.push({
            field: 'spec.template.spec.containers',
            message: "'containers' must be an array",
            severity: 'error',
            line: getLineNumber(yamlContent, 'containers')
        });
    } else {
        podSpec.containers.forEach((container, idx) => {
            if (!exists(container.name)) {
                errors.push({
                    field: `spec.template.spec.containers[${idx}].name`,
                    message: `Container ${idx} requires 'name' field`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'containers')
                });
            }
            if (!exists(container.image)) {
                errors.push({
                    field: `spec.template.spec.containers[${idx}].image`,
                    message: `Container ${idx} requires 'image' field`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'image')
                });
            }

            // Security and best practice checks
            errors.push(...validateContainerSecurity(container, idx, yamlContent));
        });
    }

    return errors;
};

// Validate Service
const validateService = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.spec)) {
        errors.push({
            field: 'spec',
            message: "Service requires 'spec' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'spec')
        });
        return errors;
    }

    const { spec } = doc;

    if (!exists(spec.selector)) {
        errors.push({
            field: 'spec.selector',
            message: "Service spec should have 'selector' field to route traffic",
            severity: 'warning',
            line: getLineNumber(yamlContent, 'selector')
        });
    }

    if (!exists(spec.ports)) {
        errors.push({
            field: 'spec.ports',
            message: "Service spec requires 'ports' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'ports')
        });
    } else if (!Array.isArray(spec.ports)) {
        errors.push({
            field: 'spec.ports',
            message: "'ports' must be an array",
            severity: 'error',
            line: getLineNumber(yamlContent, 'ports')
        });
    } else {
        spec.ports.forEach((port, idx) => {
            if (!exists(port.port)) {
                errors.push({
                    field: `spec.ports[${idx}].port`,
                    message: `Port ${idx} requires 'port' field`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'port')
                });
            }
            if (!exists(port.name) && spec.ports.length > 1) {
                errors.push({
                    field: `spec.ports[${idx}].name`,
                    message: `BEST PRACTICE: Name ports when multiple ports are defined`,
                    severity: 'warning',
                    line: getLineNumber(yamlContent, 'port')
                });
            }
        });
    }

    return errors;
};

// Validate Pod
const validatePod = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.spec)) {
        errors.push({
            field: 'spec',
            message: "Pod requires 'spec' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'spec')
        });
        return errors;
    }

    const { spec } = doc;

    if (!exists(spec.containers)) {
        errors.push({
            field: 'spec.containers',
            message: "Pod spec requires 'containers' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'containers')
        });
    } else if (!Array.isArray(spec.containers)) {
        errors.push({
            field: 'spec.containers',
            message: "'containers' must be an array",
            severity: 'error',
            line: getLineNumber(yamlContent, 'containers')
        });
    } else {
        spec.containers.forEach((container, idx) => {
            if (!exists(container.name)) {
                errors.push({
                    field: `spec.containers[${idx}].name`,
                    message: `Container ${idx} requires 'name' field`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'containers')
                });
            }
            if (!exists(container.image)) {
                errors.push({
                    field: `spec.containers[${idx}].image`,
                    message: `Container ${idx} requires 'image' field`,
                    severity: 'error',
                    line: getLineNumber(yamlContent, 'image')
                });
            }

            errors.push(...validateContainerSecurity(container, idx, yamlContent));
        });
    }

    return errors;
};

// Validate ConfigMap
const validateConfigMap = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.data) && !exists(doc.binaryData)) {
        errors.push({
            field: 'data',
            message: "ConfigMap should have either 'data' or 'binaryData' field",
            severity: 'warning',
            line: getLineNumber(yamlContent, 'data')
        });
    }

    return errors;
};

// Validate Secret
const validateSecret = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.type)) {
        errors.push({
            field: 'type',
            message: "Secret should specify 'type' field (e.g., 'Opaque', 'kubernetes.io/tls')",
            severity: 'warning',
            line: getLineNumber(yamlContent, 'type')
        });
    }

    if (!exists(doc.data) && !exists(doc.stringData)) {
        errors.push({
            field: 'data',
            message: "Secret should have either 'data' or 'stringData' field",
            severity: 'warning',
            line: getLineNumber(yamlContent, 'data')
        });
    }

    return errors;
};

// Validate Ingress
const validateIngress = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.spec)) {
        errors.push({
            field: 'spec',
            message: "Ingress requires 'spec' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'spec')
        });
        return errors;
    }

    const { spec } = doc;

    if (!exists(spec.rules) && !exists(spec.defaultBackend)) {
        errors.push({
            field: 'spec.rules',
            message: "Ingress spec should have either 'rules' or 'defaultBackend' field",
            severity: 'warning',
            line: getLineNumber(yamlContent, 'rules')
        });
    }

    if (spec.rules && Array.isArray(spec.rules)) {
        spec.rules.forEach((rule, idx) => {
            if (!rule.host) {
                errors.push({
                    field: `spec.rules[${idx}].host`,
                    message: `BEST PRACTICE: Specify host for ingress rule ${idx}`,
                    severity: 'warning',
                    line: getLineNumber(yamlContent, 'rules')
                });
            }
        });
    }

    return errors;
};

// Validate PersistentVolumeClaim
const validatePVC = (doc, yamlContent) => {
    const errors = [];

    if (!exists(doc.spec)) {
        errors.push({
            field: 'spec',
            message: "PersistentVolumeClaim requires 'spec' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'spec')
        });
        return errors;
    }

    const { spec } = doc;

    if (!exists(spec.accessModes)) {
        errors.push({
            field: 'spec.accessModes',
            message: "PVC spec requires 'accessModes' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'accessModes')
        });
    }

    if (!exists(spec.resources)) {
        errors.push({
            field: 'spec.resources',
            message: "PVC spec requires 'resources' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'resources')
        });
    } else if (!exists(spec.resources.requests)) {
        errors.push({
            field: 'spec.resources.requests',
            message: "PVC resources require 'requests' field",
            severity: 'error',
            line: getLineNumber(yamlContent, 'requests')
        });
    }

    return errors;
};

// Validate Namespace
const validateNamespace = (doc, yamlContent) => {
    const errors = [];

    // Namespaces are simple, just validate common fields
    if (doc.metadata?.name === 'default' || doc.metadata?.name === 'kube-system') {
        errors.push({
            field: 'metadata.name',
            message: `BEST PRACTICE: Avoid modifying system namespaces (${doc.metadata.name})`,
            severity: 'warning',
            line: getLineNumber(yamlContent, 'name')
        });
    }

    return errors;
};

// Main validation router
const validateK8sResource = (doc, yamlContent) => {
    let errors = [];

    // Validate common fields
    errors = errors.concat(validateCommonFields(doc, yamlContent));

    if (!doc.kind) {
        return errors;
    }

    // Validate based on kind
    switch (doc.kind) {
        case 'Deployment':
        case 'StatefulSet':
        case 'DaemonSet':
            errors = errors.concat(validateDeployment(doc, yamlContent));
            break;
        case 'Service':
            errors = errors.concat(validateService(doc, yamlContent));
            break;
        case 'Pod':
            errors = errors.concat(validatePod(doc, yamlContent));
            break;
        case 'ConfigMap':
            errors = errors.concat(validateConfigMap(doc, yamlContent));
            break;
        case 'Secret':
            errors = errors.concat(validateSecret(doc, yamlContent));
            break;
        case 'Ingress':
            errors = errors.concat(validateIngress(doc, yamlContent));
            break;
        case 'PersistentVolumeClaim':
            errors = errors.concat(validatePVC(doc, yamlContent));
            break;
        case 'Namespace':
            errors = errors.concat(validateNamespace(doc, yamlContent));
            break;
        case 'Job':
        case 'CronJob':
            // Jobs are similar to Pods
            errors = errors.concat(validatePod(doc, yamlContent));
            break;
        default:
            // Unknown kind - just validate common fields
            break;
    }

    return errors;
};

// API endpoint
app.post('/api/validate', (req, res) => {
    const yamlContent = req.body.yaml;

    if (!yamlContent) {
        return res.status(400).json({
            valid: false,
            errors: [{ message: 'No YAML content provided', severity: 'error' }]
        });
    }

    try {
        const documents = yaml.loadAll(yamlContent);
        let allErrors = [];
        let warnings = [];

        documents.forEach((doc, index) => {
            if (!doc) return;

            const docErrors = validateK8sResource(doc, yamlContent);

            docErrors.forEach(error => {
                const errorObj = {
                    document: index,
                    kind: doc.kind || 'Unknown',
                    ...error
                };

                if (error.severity === 'warning') {
                    warnings.push(errorObj);
                } else {
                    allErrors.push(errorObj);
                }
            });
        });

        if (allErrors.length > 0) {
            return res.json({
                valid: false,
                errors: allErrors,
                warnings: warnings,
                message: `Found ${allErrors.length} error(s) and ${warnings.length} warning(s)`,
                documentCount: documents.length
            });
        }

        if (warnings.length > 0) {
            return res.json({
                valid: true,
                warnings: warnings,
                message: `YAML is valid with ${warnings.length} warning(s)`,
                documentCount: documents.length
            });
        }

        return res.json({
            valid: true,
            message: 'YAML is valid Kubernetes configuration',
            documentCount: documents.length
        });

    } catch (e) {
        return res.json({
            valid: false,
            errors: [{
                message: 'YAML Syntax Error',
                details: e.message,
                line: e.mark ? e.mark.line + 1 : null,
                column: e.mark ? e.mark.column + 1 : null,
                severity: 'error'
            }]
        });
    }
});

app.listen(PORT, () => {
    console.log(`✓ Enhanced K8s YAML Linter API running on http://localhost:${PORT}`);
    console.log(`✓ Validation features: Security checks, Best practices, 10+ resource types`);
});
