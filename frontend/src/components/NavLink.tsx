import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom"
import { cn } from "../lib/utils"

interface CustomNavLinkProps extends NavLinkProps {
  activeClassName?: string
}

export const NavLink = ({ 
  className, 
  activeClassName, 
  children, 
  ...props 
}: CustomNavLinkProps) => {
  return (
    <RouterNavLink
      {...props}
      className={({ isActive }) =>
        cn(
          typeof className === "string" ? className : "",
          isActive && activeClassName
        )
      }
    >
      {children}
    </RouterNavLink>
  )
}
