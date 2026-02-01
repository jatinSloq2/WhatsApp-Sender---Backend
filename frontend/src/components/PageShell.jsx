import React from 'react';

/**
 * Wrap every authenticated page body in this.
 * Props: title, subtitle (optional), children
 */
export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="flex-1 p-6 animate-fadeIn">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Content area */}
      {children || (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 border-dashed">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-lg">⟳</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Content coming soon</p>
            <p className="text-xs text-gray-400 mt-0.5">This page is under construction</p>
          </div>
        </div>
      )}
    </div>
  );
}