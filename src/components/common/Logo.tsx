import { memo } from "react"

interface LogoProps {
  size?: "sm" | "md"
}

export const Logo = memo(function Logo({ size = "md" }: LogoProps) {
  const sizeClass = size === "sm" ? "size-4" : "size-8"

  return (
    <div className={`${sizeClass} text-forest-green`}>
      <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
})
