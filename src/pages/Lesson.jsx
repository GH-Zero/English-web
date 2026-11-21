import { useState } from 'react'
import { todayStr } from '../utils.js'
import { addToSrs, addWrong, logActivity, nextBatch } from '../learning.js'
import { stages, TRACKS, wordList, phraseList, grammarList, dialogueList, passageList, speakingList, stageOf, BATCH } from '../course/index.js'
import { translateItems } from '../exercises.js'
import WordLesson from '../lesson/WordLesson.jsx'
import GrammarLesson from '../lesson/GrammarLesson.jsx'
import DialogueLesson from '../lesson/DialogueLesson.jsx'
import PassageLesson from '../lesson/PassageLesson.jsx'
import SpeakingLesson from '../lesson/SpeakingLesson.jsx'
import StageTest from '../lesson/StageTest.jsx'

const pct = r => Math.round((r.correct / r.total) * 100)
const LISTS = { grammar: grammarList, dialogues: dialogueList, passages: passageList, speaking: speakingList }
const LABEL = { grammar: '语法', dialogues: '对话', passages: '听读', speaking: '口语' }

export default function Lesson({ lesson, progress, update, onBack }) {
  // 单词 / 短语：打开时取下一组，学完一组可以接着学
  const [batch, setBatch] = useState(() =>
    lesson.type === 'words' || lesson.type === 'phrases' ? nextBatch(progress, stages, TRACKS, lesson.type, BATCH) : [])
  const [round, setRound] = useState(0)
  // 口语课的“看中文说英文”句子：从本阶段的对话和语法例句里抽，打开时定下来
  const [translate] = useState(() => {
    if (lesson.type !== 'speaking') return []
    const stage = stageOf(speakingList[lesson.index])
    return translateItems(dialogueList.slice(...stage.dialogues), grammarList.slice(...stage.grammar), 6)
  })

  const finish = r => {
    update('wrong', w => addWrong(w, r.wrong))
    update('log', l => logActivity(l, 'lessons'))
  }
  const markDone = (key, item, r) => {
    finish(r)
    const field = TRACKS[key].done
    update(field, d => ({ ...d, [item.id]: Math.max(d?.[item.id] ?? 0, pct(r)) }))
    onBack()
  }

  let title, sub, body
  if (lesson.type === 'words' || lesson.type === 'phrases') {
    const key = lesson.type
    const isPhrase = key === 'phrases'
    if (!batch.length) {
      body = <div className="card center">本阶段的{isPhrase ? '短语' : '单词'}已经学完了。</div>
    } else {
      const stage = stageOf(batch[0])
      const list = isPhrase ? phraseList : wordList
      const pool = list.slice(Math.max(0, batch[0].index - 100), batch[0].index + 100)
      const todayN = progress.log?.[todayStr()]?.[key] || 0
      title = `${isPhrase ? '短语与搭配' : '新词'} 第 ${batch[0].index + 1} 个起`
      sub = `第 ${stage.id} 阶段 · ${stage.title}${isPhrase ? '' : ` · 今天已学 ${todayN} / ${progress.dailyGoal || 30} 个`}`
      body = (
        <WordLesson key={round} words={batch} pool={pool}
          onComplete={r => {
            finish(r)
            update('srs', s => addToSrs(s, batch))
            update('log', l => logActivity(l, key, batch.length))
          }}
          doneActions={
            <div className="row center-row mt">
              <button className="btn" onClick={() => {
                // 刚学的这组还没写进 progress，先手动排除
                const learned = new Set(batch.map(w => w.en))
                const p = { ...progress, srs: { ...progress.srs, ...Object.fromEntries([...learned].map(en => [en, 1])) } }
                const next = nextBatch(p, stages, TRACKS, key, BATCH)
                if (next.length) { setBatch(next); setRound(x => x + 1); window.scrollTo(0, 0) } else onBack()
              }}>再学一组 →</button>
              <button className="btn secondary" onClick={onBack}>返回学习计划</button>
            </div>
          } />
      )
    }
  } else if (lesson.type === 'test') {
    const { stage } = lesson
    title = '阶段结业测试'
    sub = `第 ${stage.id} 阶段 · ${stage.title}`
    body = (
      <StageTest key={stage.id} stage={stage} best={progress.tests?.[stage.id]}
        onAttempt={r => {
          update('wrong', w => addWrong(w, r.wrong))
          update('tests', t => ({ ...t, [stage.id]: Math.max(t?.[stage.id] ?? 0, pct(r)) }))
        }}
        onComplete={() => {
          update('passed', p => ({ ...p, [stage.id]: todayStr() }))
          update('log', l => logActivity(l, 'lessons'))
          onBack()
        }} />
    )
  } else {
    const key = lesson.type
    const item = LISTS[key][lesson.index]
    const stage = stageOf(item)
    title = `${LABEL[key]} ${item.index + 1}：${item.title}`
    sub = `第 ${stage.id} 阶段 · ${stage.title}`
    const done = r => markDone(key, item, r)
    if (key === 'grammar') body = <GrammarLesson g={item} onComplete={done} />
    if (key === 'dialogues') body = <DialogueLesson d={item} onComplete={done} />
    if (key === 'passages') body = <PassageLesson p={item} onComplete={done} />
    if (key === 'speaking') body = <SpeakingLesson topic={item} translate={translate} onComplete={done} />
  }

  return (
    <>
      <div className="lesson-head">
        <button className="btn secondary" onClick={onBack}>← 返回学习计划</button>
        <div>
          <div className="muted">{sub}</div>
          <div className="lesson-title">{title}</div>
        </div>
      </div>
      {body}
    </>
  )
}
