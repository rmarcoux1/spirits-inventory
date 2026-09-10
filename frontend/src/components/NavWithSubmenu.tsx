import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

interface SubmenuChild {
    label: string;
    to: string;
    end?: boolean;
}

interface Props {
    label: string;
    to: string;
    end?: boolean;
    children: SubmenuChild[];
}

// A parent nav item that's a real link (clicking the label navigates there)
// plus a caret that toggles a dropdown of related routes. Closes on
// outside click, Escape, or any route change — covers picking a child
// link, the parent label itself, or browser back/forward.
export function NavWithSubmenu({ label, to, end, children }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <div className="nav-submenu" ref={ref}>
            <div className="nav-submenu-trigger">
                <NavLink to={to} end={end}>
                    {label}
                </NavLink>
                <button
                    type="button"
                    className={`nav-submenu-caret${open ? " nav-submenu-caret--open" : ""}`}
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-label={`${label} submenu`}
                >
                    ▾
                </button>
            </div>

            <div className={`nav-submenu-panel${open ? " nav-submenu-panel--open" : ""}`} role="menu">
                {children.map((child) => (
                    <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        role="menuitem"
                        tabIndex={open ? 0 : -1}
                        className={({ isActive }) => (isActive ? "nav-submenu-item active" : "nav-submenu-item")}
                    >
                        {child.label}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}