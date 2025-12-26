// components/ui/Button.js
// Reusable button component matching design.json specifications
// Props:
//   - children: React node
//   - variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' (default: 'primary')
//   - size: 'small' | 'medium' | 'large' (default: 'medium')
//   - disabled: boolean (default: false)
//   - className: string (optional) - additional classes
//   - All standard button props (onClick, type, etc.)

'use client'

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'rounded-md font-medium transition-all cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-success text-white hover:bg-[#0D9668] active:bg-[#0A7A54] focus:ring-success',
    secondary: 'bg-gray-light text-gray-dark hover:bg-[#D1D5DB] active:bg-[#BDC1C7] focus:ring-gray-medium',
    tertiary: 'bg-gray-bg text-primary-accent hover:bg-[#4B5563] active:bg-[#374151] focus:ring-primary-accent',
    ghost: 'bg-transparent text-gray-dark hover:bg-gray-light active:bg-gray-light focus:ring-gray-medium',
  }
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-bodySmall',
    large: 'px-6 py-3 text-base',
  }
  
  const activeClasses = disabled ? '' : 'active:scale-[0.98]'
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${activeClasses} ${className}`.trim()
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

