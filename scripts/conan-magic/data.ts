import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts, WorldState } from '../../base/types';
import { has, stateEq, and, not, addTopic, removeTopic, setState, all, nothing } from '../../base/helpers';

export interface ConanNPC extends NPCBase {
  color: string;
  emoji: string;
  role: string;
}

export const NPCS: ConanNPC[] = [
  { id: 'conan', name: '柯南', role: '名侦探', emoji: '👦', color: '#3b82f6' },
  { id: 'hamano', name: '滨野', role: '宴会部长', emoji: '🎩', color: '#6b7280' },
  { id: 'tanaka', name: '田中', role: '魔术师之徒', emoji: '👩', color: '#ef4444' },
  { id: 'doito', name: '土井塔', role: '红色鲱鱼', emoji: '🥸', color: '#8b5cf6' },
];

export const TOPICS: TopicBase[] = [
  { id: 'start', label: '环顾四周' },
  { id: 'magic_chat', label: '魔术聚会' },
  { id: 'hamano_person', label: '滨野利也' },
  { id: 'scream', label: '一声尖叫' },
  { id: 'dead_body', label: '无足迹的尸体' },
  { id: 'crossbow', label: '弩箭与风筝线' },
  { id: 'harui', label: '春井风传' },
  { id: 'motive', label: '复仇动机' },
];

export const INITIAL_TOPICS = ['start'];

const hamanoDeadDialogues: DialogueBase[] = TOPICS.map(t => ({
  id: `hamano.dead.${t.id}`,
  speaker: 'hamano',
  topic: t.id,
  trigger: has('dead_body'),
  once: false,
  text: '（滨野的遗体冰冷地躺在雪地里，无法再回答你的问题了。）'
}));

export const DIALOGUES: DialogueBase[] = [
  ...hamanoDeadDialogues,
  
  // --- Conan (Self) ---
  {
    id: 'conan.start',
    speaker: 'conan', topic: 'start',
    text: '我陪着园子姐姐来到了这个雪山别墅，参加一个名为【魔术聚会】的线下活动。聚会里有几个人引起了我的注意，比如【滨野利也】。',
    effect: all(addTopic('magic_chat'), addTopic('hamano_person')),
  },
  {
    id: 'conan.magic_chat',
    speaker: 'conan', topic: 'magic_chat',
    text: '大家在网上都用假名，这次聚会也是为了交流魔术心得。不过那个怪盗基德似乎也混进来了……',
  },
  {
    id: 'conan.hamano_person',
    speaker: 'conan', topic: 'hamano_person',
    trigger: not(has('dead_body')),
    text: '网名“宴会部长”的滨野，为人开朗，似乎准备了什么余兴节目。',
  },
  {
    id: 'conan.hamano_person_dead',
    speaker: 'conan', topic: 'hamano_person',
    trigger: has('dead_body'),
    text: '滨野已经被杀害了，变成了【无足迹的尸体】。',
    effect: addTopic('dead_body'),
  },
  {
    id: 'conan.scream',
    speaker: 'conan', topic: 'scream',
    text: '（你听到了外面的惊叫声，冲出门去，发现雪地中央躺着【无足迹的尸体】。）',
    effect: addTopic('dead_body'),
  },
  {
    id: 'conan.dead_body',
    speaker: 'conan', topic: 'dead_body',
    text: '尸体周围没有任何脚印，这是一起典型的无足迹杀人！等等，我在树枝上发现了【弩箭与风筝线】的勒痕。',
    effect: addTopic('crossbow'),
  },
  {
    id: 'conan.crossbow',
    speaker: 'conan', topic: 'crossbow',
    text: '凶手利用弩箭将风筝线射到远处的树上，把遗体滑了过去……凶手一定是为了某个【复仇动机】！',
    effect: addTopic('motive'),
  },
  {
    id: 'conan.motive',
    speaker: 'conan', topic: 'motive',
    text: '我记得以前有一位很有名的逃脱魔术师【春井风传】在表演中意外身亡。这和案件有关吗？',
    effect: addTopic('harui'),
  },

  // --- Hamano (Alive) ---
  {
    id: 'hamano.alive.magic_chat',
    speaker: 'hamano', topic: 'magic_chat',
    trigger: not(has('dead_body')),
    text: '哈哈，我是网名“宴会部长”的滨野！今晚的【一声尖叫】……哦不，今晚的余兴节目一定让大家大吃一惊！',
    effect: addTopic('scream'),
  },
  {
    id: 'hamano.alive.start',
    speaker: 'hamano', topic: 'start',
    trigger: not(has('dead_body')),
    text: '欢迎来到别墅！晚上我们一起变魔术吧！',
  },

  // --- Tanaka ---
  {
    id: 'tanaka.start',
    speaker: 'tanaka', topic: 'start',
    text: '你好小弟弟，外面雪下得好大。',
  },
  {
    id: 'tanaka.magic_chat',
    speaker: 'tanaka', topic: 'magic_chat',
    text: '我叫田中贵久惠，网名是“魔术师之徒”。我只是来学习魔术的。',
  },
  {
    id: 'tanaka.scream',
    speaker: 'tanaka', topic: 'scream',
    text: '发生什么事了？怎么会有惨叫……难道滨野先生他……',
  },
  {
    id: 'tanaka.harui',
    speaker: 'tanaka', topic: 'harui',
    text: '春井风传……（她神色慌张）那是我最尊敬的爷爷！他们不该在网上嘲笑他的死！',
  },
  {
    id: 'tanaka.crossbow',
    speaker: 'tanaka', topic: 'crossbow',
    text: '（眼神闪烁）我不知道你在说什么弩箭，小弟弟，你电影看多了吧。',
  },

  // --- Doito ---
  {
    id: 'doito.start',
    speaker: 'doito', topic: 'start',
    text: '我身材有点胖，走雪路可真费劲啊。',
  },
  {
    id: 'doito.magic_chat',
    speaker: 'doito', topic: 'magic_chat',
    text: '我是土井塔克树！大家一起好好享受这个聚会吧。（他的眼神似乎看透了一切）',
  },
  {
    id: 'doito.dead_body',
    speaker: 'doito', topic: 'dead_body',
    text: '真是可怕的现场啊，小弟弟。你觉得会是谁干的呢？',
  },
  {
    id: 'doito.crossbow',
    speaker: 'doito', topic: 'crossbow',
    text: '原来如此，利用风筝线做索道啊……真聪明的推理，不愧是名侦探。',
  },
];

export const ENDINGS: EndingBase[] = [
  {
    id: 'true_end',
    title: '真相只有一个！',
    body: `你指出了真凶是田中贵久惠！
    
【评分】
调查次数：{VISITS}
结算得分：{SCORE} 分

田中哭诉着坦白了一切，她利用弩箭和风筝线制造了无足迹杀人，为她死去的祖父春井风传报仇。
干得漂亮，名侦探！`,
    condition: (w: WorldState) => w.custom.accused === 'tanaka',
  },
  {
    id: 'bad_end',
    title: '推理错误',
    body: `你做出了错误的指控。
    
【评分】
调查次数：{VISITS}
结算得分：0 分 (找错凶手)

真凶在暗处冷笑，案件成了悬案，而怪盗基德也悄然离去……`,
    condition: (w: WorldState) => w.custom.accused !== undefined && w.custom.accused !== 'tanaka',
  }
];

export const TEXTS: ScriptTexts = {
  introHint: '柯南，雪山别墅发生了一起连环杀人案，找出真凶吧。',
  hintIdle: '选择一个话题向对应的人物询问。',
  hintSelected: '你想用「{topic}」跟谁聊聊？',
  hintEnded: '案件已完结。',
  cancelLabel: '取消',
  silentReply: '（{npc} 似乎对「{topic}」没有什么想说的）',
  newTopicsFlash: '获得线索：{topics}',
  endingFooter: 'THE END',
  // @ts-ignore - custom text used in logic.ts
  accusePanelHint: '推理完毕？请指控凶手：',
  // @ts-ignore - custom text used in logic.ts
  accusePrefix: '指控',
};