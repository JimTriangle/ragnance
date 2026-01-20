import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p className="footer-copyright">
                    © {new Date().getFullYear()} Ragnance. Tous droits réservés.
                </p>
                <nav className="footer-links">
                    <Link to="/privacy-policy" className="footer-link">
                        Politique de Confidentialité
                    </Link>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
