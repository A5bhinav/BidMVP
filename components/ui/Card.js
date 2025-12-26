// components/ui/Card.js
// Reusable card component matching design.json specifications
// Props:
//   - children: React node
//   - variant: 'default' | 'elevated' | 'flat' (default: 'default')
//   - className: string (optional) - additional classes
//   - onClick: function (optional) - makes card clickable

'use client'

export default function Card({ children, variant = 'default', className = '', onClick, ...props }) {
  const baseClasses = 'bg-neutral-white rounded-lg p-6'
  
  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg',
    flat: 'shadow-none',
  }
  
  const interactiveClasses = onClick ? 'cursor-pointer transition-all hover:shadow-lg' : ''
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`.trim()
  
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}

