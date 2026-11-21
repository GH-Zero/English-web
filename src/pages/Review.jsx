import { useState } from 'react'
import { wordList, phraseList, grammarList } from '../course/index.js'
import { dueWords, gradeSrs, addWrong, logActivity, MASTERED_BOX } from '../learning.js'
import { randomWordEx, grammarReviewSet } from '../exercises.js'
import { sample } from '../utils.js'
import Drill from '../components/Drill.jsx'
import Summary from '../lesson/Summary.jsx'

const MAX = 50
const byEn = Object.fromEntries([wordList, phraseList].flatMap(list => list.map(w => [w.en, { ...w, list }])))
// 干扰项取同类、难度相近的词条
const poolOf = w => w.list.slice(Math.max(0, w.index - 60), w.index + 60)

export default function Review({ progress, update }) {
  const srs = progress.srs || {}
  const [session, setSession] = useState(null) // { items, graded }
  const [result, setResult] = useState(null)
  const due = dueWords(srs).filter(en => byEn[en])
  const learned = Object.keys(srs).filter(en => byEn[en])

  const start = (list, graded) => {
    setResult(null)
    setSession({ graded, items: list.map(en => randomWordEx(byEn[en], poolOf(byEn[en]))) })
  }

  // 语法综合复习：只从已学完的语法点里抽
  const learnedGrammar = grammarList.filter(g => g.id in (progress.gDone || {}))
  const startGrammar = () => {
    setResult(null)
    setSession({ grammar: true, items: grammarReviewSet(learnedGrammar, progress.gDone, progress.wrong, 20) })
  }

  const finish = r => {
    if (session.grammar) {
      update('log', l => logActivity(l, 'grammarReview', session.items.length))
    } else if (session.graded) {
      const res = {}
      for (const ex of session.items) res[ex.word] = r.first[ex.id]
      update('srs', s => gradeSrs(s, res))
      update('log', l => logActivity(l, 'reviewed', session.items.length))
    }
    update('wrong', w => addWrong(w, r.wrong))
    setResult({ ...r, kind: session.grammar ? 'grammar' : 'words' }); setSession(null)
  }

  if (session) {
    return (
      <div className="card">
        <h2>{session.grammar ? '语法综合复习' : session.graded ? '记忆曲线复习' : '自由练习'}</h2>
        <Drill items={session.items} onFinish={finish} />
      </div>
    )
  }

  if (result) {
    return <Summary result={result} title="复习完成"
      note={result.kind === 'grammar' ? '答错的语法题已放进错题本，下次综合复习会更多地出这些语法点。' : '答对的词下次复习间隔会变长，答错的词明天会再出现。'}
      onNext={() => setResult(null)} nextLabel="好的" />
  }

  const boxes = [1, 2, 3, 4, 5, 6].map(b => learned.filter(en => srs[en].box === b).length)
  return (
    <>
      <div className="card center">
        <h2>每日复习</h2>
        <div className="desc mt">
          按记忆曲线安排：答对一次，间隔从 1 天逐步拉长到 2、4、7、15、30 天；答错就回到 1 天。
        </div>
        <div className="score-big mt">{due.length}</div>
        <div className="desc">个单词今天需要复习{due.length > MAX && `（每次最多 ${MAX} 个）`}</div>
        <div className="row center-row mt">
          <button className="btn" disabled={!due.length} onClick={() => start(due.slice(0, MAX), true)}>开始复习</button>
          <button className="btn secondary" disabled={learned.length < 4}
            onClick={() => start(sample(learned, 10), false)}>随机练 10 个（不影响计划）</button>
        </div>
      </div>
      <div className="card center">
        <h2>语法综合复习</h2>
        <div className="desc mt">
          从已学完的 {learnedGrammar.length} 个语法点里混合出 20 题，错得多、分数低的语法点出得更多。建议每 2–3 天做一次。
        </div>
        <button className="btn mt" disabled={!learnedGrammar.length} onClick={startGrammar}>开始语法复习</button>
      </div>
      {learned.length > 0 && (
        <div className="card">
          <h2>记忆强度分布</h2>
          <div className="desc">第 {MASTERED_BOX} 级及以上算“已掌握”</div>
          <div className="box-bars">
            {boxes.map((n, i) => (
              <div key={i} className="box-bar">
                <div className="bar" style={{ height: `${Math.max(4, (n / learned.length) * 120)}px` }} />
                <div className="n">{n}</div>
                <div className="l">{i + 1} 级</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
