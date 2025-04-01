import React from 'react';

interface ToastProps {
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';
}

export const Toast: React.FC<ToastProps> = ({ title, description, variant }) => {
    const variantStyles: { [key in ToastProps['variant']]: string } = {
        default: 'bg-gray-800 text-white',
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white',
        destructive: 'bg-red-700 text-white',
    };

    return (
        <div className={`p-4 mb-4 rounded ${variantStyles[variant]}`}>
            {title && <div className="font-bold">{title}</div>}
            {description && <div>{description}</div>}
        </div>
    );
};
