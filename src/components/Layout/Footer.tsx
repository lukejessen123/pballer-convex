import React from 'react';

interface FooterProps {
  user?: any;
  isSuperAdmin?: boolean;
  profileId?: string;
  userRole?: string;
}

const Footer: React.FC<FooterProps> = ({ 
  user, 
  isSuperAdmin, 
  profileId,
  userRole
}) => {
  const currentYear = new Date().getFullYear();
  
  // Determine if footer links should be hidden based on user role
  const hideFooterLinks = !user || !profileId || userRole === 'player';

  return (
    <>
      {isSuperAdmin ? (
        <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white dark:bg-primary-500">
                  P
                </div>
                <span className="text-xl font-bold text-primary-400">Pickleball League Manager</span>
              </div>
              <p className="text-gray-400 max-w-xs">Making pickleball league management simple and fun.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h4 className="font-semibold mb-2 text-white">Links</h4>
                <ul className="space-y-1">
                  <li>
                    <a href="/" className="hover:text-primary-400">Home</a>
                  </li>
                  <li>
                    <a href="/leagues" className="hover:text-primary-400">Leagues</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Help</h4>
                <ul className="space-y-1">
                  <li>
                    <a href="/faq" className="hover:text-primary-400">FAQ</a>
                  </li>
                  <li>
                    <a href="/contact" className="hover:text-primary-400">Contact</a>
                  </li>
                  <li>
                    <a href="/privacy" className="hover:text-primary-400">Privacy</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      ) : null}
      <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
        <p>© {currentYear} Pickleball League Manager. All rights reserved.</p>
      </div>
    </>
  );
};

export default Footer;