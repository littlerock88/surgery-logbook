export function calculateScore(logs, catalog) {
  const level1 = catalog.filter(p => p.level === '1')
  const level1Detail = level1.map(proc => {
    const count = logs.filter(l => l.procedureId === proc.id).length
    return { ...proc, count, done: count >= 2 }
  })
  const level1Complete = level1Detail.every(p => p.done)

  const level21 = catalog.filter(p => p.level === '2.1')
  const level21Detail = level21.map(proc => {
    const count = logs.filter(l => l.procedureId === proc.id).length
    return { ...proc, count, done: count >= 1 }
  })
  const level21Complete = level21Detail.every(p => p.done)

  const level22 = catalog.filter(p => p.level === '2.2')
  const level22Done = level22.filter(proc =>
    logs.filter(l => l.procedureId === proc.id).length >= 1
  )
  const level22Complete = level22Done.length >= 1

  const level5 = catalog.filter(p => p.level === '5')
  const level5Count = logs.filter(l =>
    level5.some(p => p.id === l.procedureId)
  ).length
  const level5Complete = level5Count >= 4

  const uniqueTypes = new Set(logs.map(l => l.procedureId)).size
  const allComplete = level1Complete && level21Complete && level22Complete && level5Complete

  return {
    score: allComplete ? 10 : uniqueTypes >= 5 ? 5 : 0,
    allComplete,
    uniqueTypes,
    level1:  { detail: level1Detail,  complete: level1Complete },
    level21: { detail: level21Detail, complete: level21Complete },
    level22: { done: level22Done.length, required: 1, complete: level22Complete },
    level5:  { count: level5Count,    required: 4, complete: level5Complete },
  }
}