import React from 'react';

const TreeView = ({ data }) => {
    if (!data || !data.name) {
        return <pre className="bg-gray-900 p-3 rounded-md text-sm text-red-400 font-roboto-mono overflow-auto max-h-64">Invalid or empty tree data</pre>;
    }

    const generateTreeString = (tree) => {
        let result = '';
        const traverse = (node, prefix, isLast) => {
            result += `${prefix}${isLast ? '└── ' : '├── '}${node.name}\n`;
            if (node.children) {
                const childrenPrefix = prefix + (isLast ? '    ' : '│   ');
                node.children.forEach((child, index) => {
                    const isChildLast = index === node.children.length - 1;
                    traverse(child, childrenPrefix, isChildLast);
                });
            }
        };

        result += `${tree.name}\n`;
        if (tree.children) {
            tree.children.forEach((child, index) => {
                const isChildLast = index === tree.children.length - 1;
                traverse(child, '', isChildLast);
            });
        }
        return result;
    };

    const treeString = generateTreeString(data);

    return (
        <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-roboto-mono overflow-auto max-h-64 whitespace-pre">
            {treeString}
        </pre>
    );
};

export default TreeView;
