import fs from 'fs';
import path from 'path';

// Mapeo de Material a Lucide
const iconMap = {
  'construction': 'Hammer',
  'trending_up': 'TrendingUp',
  'description': 'FileText',
  'warning': 'AlertTriangle',
  'add_circle': 'PlusCircle',
  'keyboard_return': 'CornerDownLeft',
  'close': 'X',
  'receipt_long': 'Receipt',
  'arrow_upward': 'ArrowUp',
  'pending_actions': 'Clock',
  'search': 'Search',
  'picture_as_pdf': 'FileBox',
  'mail': 'Mail',
  'payments': 'CircleDollarSign',
  'chevron_left': 'ChevronLeft',
  'chevron_right': 'ChevronRight',
  'check_circle': 'CheckCircle',
  'task_alt': 'CheckCircle2',
  'inventory_2': 'Package',
  'report': 'AlertOctagon',
  'add': 'Plus',
  'edit': 'Edit2',
  'badge': 'BadgeInfo',
  'history_edu': 'History',
  'account_balance_wallet': 'Wallet',
  'info': 'Info',
  'swap_vertical_circle': 'ArrowUpDown',
  'local_shipping': 'Truck',
  'notes': 'AlignLeft',
  'edit_document': 'FileEdit',
  'print': 'Printer'
};

const defaultIcon = 'Box';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.resolve('src');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Si tiene iconos material
    if (content.includes('material-symbols-outlined')) {
      let importedIcons = new Set();
      
      const regex = /<span\s+className="([^"]*material-symbols-outlined[^"]*)"(?:[^>]*)>([^<]+)<\/span>/g;
      
      let modifiedContent = content.replace(regex, (match, classNames, iconName) => {
        const cleanName = iconName.trim();
        const lucideIcon = iconMap[cleanName] || defaultIcon;
        importedIcons.add(lucideIcon);
        
        let newClasses = classNames.replace('material-symbols-outlined', '').trim();
        return `<${lucideIcon} className="${newClasses} w-5 h-5" />`;
      });
      
      if (importedIcons.size > 0) {
        const importStatement = `\nimport { ${Array.from(importedIcons).join(', ')} } from 'lucide-react';\n`;
        const lines = modifiedContent.split('\n');
        lines.splice(1, 0, importStatement);
        modifiedContent = lines.join('\n');
      }
      
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      console.log(`Migrated: ${filePath}`);
    }
  }
});
console.log('Migration Complete!');
