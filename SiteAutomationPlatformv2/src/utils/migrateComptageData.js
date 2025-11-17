// Migration utility to clean up old Comptage data and prepare for new 4-type system
// Run this once in browser console after updating the code

export const migrateComptageData = () => {
  console.log('🔄 Starting Comptage migration...');

  // Get all localStorage keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('Comptage') || key.includes('comptage'))) {
      keysToRemove.push(key);
    }
  }

  console.log(`📦 Found ${keysToRemove.length} old comptage keys:`, keysToRemove);

  // Remove old comptage data
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
  });

  console.log('🎉 Migration complete! Please refresh the page.');
  return {
    removed: keysToRemove.length,
    keys: keysToRemove
  };
};

// Auto-run migration if old Comptage format is detected
if (typeof window !== 'undefined') {
  const hasOldComptage = Object.keys(localStorage).some(key =>
    key.includes('Comptage') && !key.includes('Comptage_')
  );

  if (hasOldComptage) {
    console.warn('⚠️ Old Comptage format detected!');
    console.log('Run migrateComptageData() to clean up and refresh.');
  }
}

export default migrateComptageData;
