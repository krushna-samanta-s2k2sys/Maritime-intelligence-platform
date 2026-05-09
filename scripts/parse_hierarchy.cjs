const X = require('../node_modules/xlsx')
const fs = require('fs')
const wb = X.readFile('./MaritimeData1.xlsx')
const ws = wb.Sheets['Maritime Data']
const data = X.utils.sheet_to_json(ws, { header: 1, defval: '' })

// Rightmost non-empty = leaf; parent columns carry over from prior rows
let lv = ['', '', '', '', '', '', '', '']
const tree = []
data.forEach(row => {
  let depth = -1
  for (let c = 0; c < row.length; c++) {
    if (row[c] !== '') {
      lv[c] = String(row[c]).trim()
      for (let x = c + 1; x < 8; x++) lv[x] = ''
      depth = c
    }
  }
  if (depth >= 0) {
    tree.push({ d: depth, l: lv[depth], p: lv.slice(0, depth + 1).filter(v => v !== '') })
  }
})

// Ship hierarchy up to depth 5
const shipLines = tree
  .filter(n => n.p[1] === 'Ship' && n.d >= 2 && n.d <= 6)
  .map(n => '  '.repeat(n.d - 2) + n.l)
  .join('\n')

// Top-level sections
const topLines = [...new Set(tree.filter(n => n.d <= 3).map(n => '  '.repeat(n.d) + n.l))].join('\n')

fs.writeFileSync('./scripts/ship_hierarchy.txt', shipLines)
fs.writeFileSync('./scripts/top_hierarchy.txt', topLines)
process.stdout.write('Done: ' + tree.length + ' nodes, ship: ' + tree.filter(n=>n.p[1]==='Ship').length + '\n')
