const row = { " Park Name ": "Cubbon Park", "District": "Bangalore Urban" };

const getValue = (keys) => {
  for (const k of keys) {
    const foundKey = Object.keys(row).find(
      (rk) => rk.trim().toLowerCase() === k.toLowerCase()
    );
    if (foundKey) return row[foundKey];
  }
  return undefined;
};

console.log('Test 1:', getValue(['Park Name']));
console.log('Test 2:', getValue(Object.keys(row)));
