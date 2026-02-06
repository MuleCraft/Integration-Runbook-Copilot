import React from 'react';

// Utility to render bullet points from AI text
export function renderBulletPoints(text: string | null | undefined): React.ReactElement {
    // Handle non-string values
    if (!text || typeof text !== 'string') {
        return <></>;
    }

    // Split by bullet points or newlines
    const lines = text.split('\n').filter(line => line.trim());

    return (
        <ul className="space-y-2">
            {lines.map((line, idx) => {
                // Remove existing bullet characters
                const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                return cleanLine ? (
                    <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="flex-1">{cleanLine}</span>
                    </li>
                ) : null;
            })}
        </ul>
    );
}
