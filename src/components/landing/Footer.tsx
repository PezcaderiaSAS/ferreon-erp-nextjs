import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function Footer() {
  const { brand, footer } = LANDING_CONFIG;

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-amber-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-orange-400 transition-colors">
                {brand.name}
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {brand.shortDescription}
            </p>
            <div className="pt-2 text-xs text-slate-400">
              Desarrollado para alta disponibilidad y normatividad comercial colombiana y latinoamericana.
            </div>
          </div>

          {/* Categorized Link Columns */}
          {footer.sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {section.title}
              </h3>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Copyright & Social Icons Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{footer.copyright}</p>

          {/* Social Icons with accessible ARIA */}
          <div className="flex items-center gap-4">
            {footer.social.map((s) => (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.platform}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="text-xs font-semibold">{s.platform.split(' ')[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
