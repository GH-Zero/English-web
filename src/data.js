// 学习内容数据：字母音标、词汇、对话、测验题

export const letters = [
  { ch: 'A', sound: '/eɪ/ 如 name' }, { ch: 'B', sound: '/biː/' },
  { ch: 'C', sound: '/siː/' }, { ch: 'D', sound: '/diː/' },
  { ch: 'E', sound: '/iː/ 如 see' }, { ch: 'F', sound: '/ef/' },
  { ch: 'G', sound: '/dʒiː/' }, { ch: 'H', sound: '/eɪtʃ/' },
  { ch: 'I', sound: '/aɪ/ 如 time' }, { ch: 'J', sound: '/dʒeɪ/' },
  { ch: 'K', sound: '/keɪ/' }, { ch: 'L', sound: '/el/' },
  { ch: 'M', sound: '/em/' }, { ch: 'N', sound: '/en/' },
  { ch: 'O', sound: '/əʊ/ 如 go' }, { ch: 'P', sound: '/piː/' },
  { ch: 'Q', sound: '/kjuː/' }, { ch: 'R', sound: '/ɑː(r)/' },
  { ch: 'S', sound: '/es/' }, { ch: 'T', sound: '/tiː/' },
  { ch: 'U', sound: '/juː/ 如 use' }, { ch: 'V', sound: '/viː/' },
  { ch: 'W', sound: '/ˈdʌbljuː/' }, { ch: 'X', sound: '/eks/' },
  { ch: 'Y', sound: '/waɪ/' }, { ch: 'Z', sound: '/zed/ /ziː/' },
]

export const phonics = [
  { title: '长元音 /eɪ/', tip: 'a + 辅音 + e 常读 /eɪ/', words: ['name', 'cake', 'late'] },
  { title: '短元音 /æ/', tip: '闭音节中的 a 常读 /æ/', words: ['cat', 'map', 'bad'] },
  { title: '长元音 /iː/', tip: 'e/ee/ea 常读 /iː/', words: ['see', 'tea', 'meet'] },
  { title: '双元音 /aɪ/', tip: 'i + 辅音 + e 常读 /aɪ/', words: ['time', 'like', 'five'] },
  { title: '辅音组合 th', tip: 'th 多读 /θ/ 或 /ð/', words: ['this', 'that', 'three'] },
]

export const wordGroups = [
  {
    title: '第一课 · 打招呼',
    words: [
      { en: 'hello', ph: '/həˈləʊ/', zh: '你好' },
      { en: 'hi', ph: '/haɪ/', zh: '嗨' },
      { en: 'goodbye', ph: '/ˌɡʊdˈbaɪ/', zh: '再见' },
      { en: 'thank you', ph: '/ˈθæŋk juː/', zh: '谢谢' },
      { en: 'sorry', ph: '/ˈsɒri/', zh: '对不起' },
      { en: 'please', ph: '/pliːz/', zh: '请' },
    ],
  },
  {
    title: '第二课 · 自我介绍',
    words: [
      { en: 'name', ph: '/neɪm/', zh: '名字' },
      { en: 'I', ph: '/aɪ/', zh: '我' },
      { en: 'you', ph: '/juː/', zh: '你' },
      { en: 'am', ph: '/æm/', zh: '是（我）' },
      { en: 'from', ph: '/frɒm/', zh: '来自' },
      { en: 'China', ph: '/ˈtʃaɪnə/', zh: '中国' },
    ],
  },
  {
    title: '第三课 · 数字',
    words: [
      { en: 'one', ph: '/wʌn/', zh: '一' },
      { en: 'two', ph: '/tuː/', zh: '二' },
      { en: 'three', ph: '/θriː/', zh: '三' },
      { en: 'four', ph: '/fɔː(r)/', zh: '四' },
      { en: 'five', ph: '/faɪv/', zh: '五' },
      { en: 'ten', ph: '/ten/', zh: '十' },
    ],
  },
  {
    title: '第四课 · 家庭',
    words: [
      { en: 'family', ph: '/ˈfæməli/', zh: '家庭' },
      { en: 'father', ph: '/ˈfɑːðə(r)/', zh: '爸爸' },
      { en: 'mother', ph: '/ˈmʌðə(r)/', zh: '妈妈' },
      { en: 'brother', ph: '/ˈbrʌðə(r)/', zh: '兄弟' },
      { en: 'sister', ph: '/ˈsɪstə(r)/', zh: '姐妹' },
      { en: 'friend', ph: '/frend/', zh: '朋友' },
    ],
  },
  {
    title: '第五课 · 常用物品',
    words: [
      { en: 'water', ph: '/ˈwɔːtə(r)/', zh: '水' },
      { en: 'food', ph: '/fuːd/', zh: '食物' },
      { en: 'book', ph: '/bʊk/', zh: '书' },
      { en: 'phone', ph: '/fəʊn/', zh: '手机' },
      { en: 'house', ph: '/haʊs/', zh: '房子' },
      { en: 'car', ph: '/kɑː(r)/', zh: '汽车' },
    ],
  },
]

export const dialogues = [
  {
    title: '初次见面',
    lines: [
      { who: '你', en: 'Hello! My name is Li Ming. What is your name?', zh: '你好！我叫李明。你叫什么名字？', right: false },
      { who: '对方', en: 'Hi, Li Ming! I am Anna. Nice to meet you.', zh: '嗨，李明！我是安娜。很高兴认识你。', right: true },
      { who: '你', en: 'Nice to meet you too. Where are you from?', zh: '我也很高兴认识你。你来自哪里？', right: false },
      { who: '对方', en: 'I am from America. And you?', zh: '我来自美国。你呢？', right: true },
      { who: '你', en: 'I am from China.', zh: '我来自中国。', right: false },
    ],
  },
  {
    title: '在咖啡店点单',
    lines: [
      { who: '店员', en: 'Good morning! What would you like?', zh: '早上好！您想要点什么？', right: true },
      { who: '你', en: 'A cup of coffee, please.', zh: '请给我一杯咖啡。', right: false },
      { who: '店员', en: 'Anything else?', zh: '还要别的吗？', right: true },
      { who: '你', en: 'No, thank you. How much is it?', zh: '不了，谢谢。多少钱？', right: false },
      { who: '店员', en: 'Five dollars, please.', zh: '五美元。', right: true },
      { who: '你', en: 'Here you are. Thank you!', zh: '给你。谢谢！', right: false },
    ],
  },
  {
    title: '问路',
    lines: [
      { who: '你', en: 'Excuse me, where is the bus stop?', zh: '打扰一下，公交车站在哪里？', right: false },
      { who: '路人', en: 'Go straight and turn left. It is over there.', zh: '直走然后左转。就在那边。', right: true },
      { who: '你', en: 'How long does it take?', zh: '需要多长时间？', right: false },
      { who: '路人', en: 'About five minutes.', zh: '大概五分钟。', right: true },
      { who: '你', en: 'Thank you very much!', zh: '非常感谢！', right: false },
    ],
  },
]

export const quizBank = [
  { q: '"你好" 的英语是？', options: ['Hello', 'Goodbye', 'Sorry', 'Please'], answer: 0 },
  { q: '"Thank you" 的意思是？', options: ['对不起', '谢谢', '请', '再见'], answer: 1 },
  { q: 'My ___ is Li Ming.（我的名字）', options: ['friend', 'family', 'name', 'house'], answer: 2 },
  { q: '"三" 的英语是？', options: ['two', 'three', 'ten', 'five'], answer: 1 },
  { q: 'mother 的意思是？', options: ['爸爸', '姐妹', '兄弟', '妈妈'], answer: 3 },
  { q: '"水" 的英语是？', options: ['food', 'book', 'water', 'car'], answer: 2 },
  { q: 'I am ___ China.（我来自中国）', options: ['from', 'to', 'in', 'at'], answer: 0 },
  { q: 'Nice to ___ you.（很高兴认识你）', options: ['see', 'meet', 'look', 'watch'], answer: 1 },
  { q: '"多少钱" 用英语怎么说？', options: ['How old are you?', 'How much is it?', 'What is this?', 'Who are you?'], answer: 1 },
  { q: 'phone 的意思是？', options: ['书', '房子', '手机', '汽车'], answer: 2 },
]
