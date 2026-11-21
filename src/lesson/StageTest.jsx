import { useState } from 'react'
import { stageTestSet, TEST_SIZE } from '../exercises.js'
import { wordList, phraseList, grammarList, dialogueList } from '../course/index.js'
import Drill from '../components/Drill.jsx'
import Summary from './Summary.jsx'

export const PASS = 80

export default function StageTest({ stage, best, onComplete, onAttempt }) {
  const [set, setSet] = useState(null)
  const [result, setResult] = useState(null)

  const start = () => { setResult(null); setSet(stageTestSet(stage, { wordList, phraseList, grammarList, dialogueList })) }
  const total = TEST_SIZE.words + TEST_SIZE.phrases + TEST_SIZE.grammar + TEST_SIZE.dialogues

  if (!set) {
    return (
      <div className="card center">
        <h2>第 {stage.id} 阶段 · {stage.title} 结业测试</h2>
        <div className="desc mt">
          {total} 道题：单词 {TEST_SIZE.words} + 短语 {TEST_SIZE.phrases} + 语法 {TEST_SIZE.grammar} + 对话句子 {TEST_SIZE.dialogues}，
          从本阶段全部内容中随机抽取，每题只有一次机会。
        </div>
        <div className="desc">达到 {PASS} 分才算通过，通过后解锁下一阶段。</div>
        {best != null && <div className="desc">历史最好：{best} 分</div>}
        <button className="btn mt" onClick={start}>开始测试</button>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="card">
        <h2>阶段测试</h2>
        <Drill items={set} mode="test" onFinish={r => { setResult(r); onAttempt(r) }} />
      </div>
    )
  }

  const score = Math.round((result.correct / result.total) * 100)
  const passed = score >= PASS
  return (
    <Summary result={result}
      title={passed ? `🎉 通过！${score} 分` : `${score} 分，还差一点`}
      note={passed ? '下一阶段已解锁。' : `需要 ${PASS} 分。建议先把错题本和到期复习做完，再重新测试（每次题目都会重新抽取）。`}
      onNext={passed ? () => onComplete({ ...result, score }) : null}
      nextLabel="返回学习计划"
      extra={!passed && <button className="btn mt" onClick={start}>重新测试</button>} />
  )
}
