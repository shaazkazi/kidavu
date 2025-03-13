import { NavLink } from 'react-router-dom';
import { FiHome, FiBarChart2, FiCheckSquare, FiCalendar, FiBook, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const links = [
    { to: '/', icon: <FiHome />, label: 'Home' },
    { to: '/growth', icon: <FiBarChart2 />, label: 'Growth' },
    { to: '/milestones', icon: <FiCheckSquare />, label: 'Milestones' },
    { to: '/vaccinations', icon: <FiCalendar />, label: 'Vaccinations' },
    { to: '/journal', icon: <FiBook />, label: 'Journal' },
    { to: '/settings', icon: <FiSettings />, label: 'Settings' },
  ];

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="bg-white dark:bg-gray-800 w-16 md:w-64 hidden md:flex flex-col border-r border-gray-200 dark:border-gray-700"
    >
      <div className="p-5 flex flex-col items-center md:items-start">
        <div className="font-bold text-2xl text-primary-600 dark:text-primary-400 md:block hidden">
          Kidavu
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 md:block hidden">
          Baby Development Tracker
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <nav className="mt-5 flex-1 px-2">
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center px-2 py-3 rounded-md transition-colors duration-200 ${
                    isActive 
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <div className="text-xl mr-3">{link.icon}</div>
                <span className="hidden md:block">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
