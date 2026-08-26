import { NavLink } from 'react-router-dom';
import { Home, Gamepad2, Zap, Calendar, Mic } from 'lucide-react';

export function ElderlyNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`} end>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/games" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Gamepad2 size={24} />
        <span>Games</span>
      </NavLink>
      <NavLink to="/activities" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Zap size={24} />
        <span>Activities</span>
      </NavLink>
      <NavLink to="/myday" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>My Day</span>
      </NavLink>
      {/* This tab opens the voice conversation screen — labeled "Talk", not
          "Help", so it doesn't read as a support/FAQ destination it isn't. */}
      <NavLink to="/voice" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Mic size={24} />
        <span>Talk</span>
      </NavLink>
    </nav>
  );
}
