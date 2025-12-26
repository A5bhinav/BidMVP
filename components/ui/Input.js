// components/ui/Input.js
// Reusable input component matching design.json specifications
// Props:
//   - error: boolean or string (optional) - shows error state
//   - className: string (optional) - additional classes
//   - All standard input props (value, onChange, placeholder, etc.)

'use client'

export default function Input({ error, className = '', ...props }) {
  const baseClasses = 'rounded-md border px-4 py-3 text-base transition-all w-full bg-white'
  
  const stateClasses = error
    ? 'border-error focus:border-error focus:ring-error'
    : 'border-gray-light focus:border-primary-accent focus:ring-primary-accent'
  
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const disabledClasses = props.disabled
    ? 'bg-neutral-white text-gray-medium cursor-not-allowed'
    : ''
  
  const combinedClasses = `${baseClasses} ${stateClasses} ${focusClasses} ${disabledClasses} ${className}`.trim()
  
  return (
    <input
      className={combinedClasses}
      {...props}
    />
  )
}

