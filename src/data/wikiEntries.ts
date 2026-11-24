export interface WikiFigure {
  name: string;
  role: string;
  img?: string;
}

export interface WikiSquad {
  name: string;
  desc: string;
  members?: string;
  img?: string;
  portraits?: { name: string; img: string }[];
}

export interface WikiSection {
  title: string;
  paras?: string[];
  items?: string[];
  quote?: string;
  squads?: WikiSquad[];
  links?: { label: string; id: string }[];
}

export interface WikiEntry {
  id: string;
  name: string;
  crumb: string;
  latin: string;
  kind: string;
  emblem?: string;
  tagline: string;
  lead: string[];
  meta?: { label: string; value: string }[];
  figures?: WikiFigure[];
  sections: WikiSection[];
  related?: { label: string; id: string }[];
}

export const wikiEntries: WikiEntry[] = [
  {
    id: 'council',
    name: '联合世界政府议会',
    crumb: '议会',
    latin: 'World Government Council',
    kind: '政治机构',
    emblem: '/media/wiki/council.png',
    tagline: '统筹空中花园各项事宜的最高议事机构。',
    lead: [
      '阿卡狄亚“大撤退”结束后，免疫时代末期，伊甸Ⅱ型星际殖民舰“空中花园”成为人类之子退守太空后的唯一驻地，也是人类文明火种的最后寄存处。为谋求文明的未来、收复地球故土，联合世界政府设置议会，统筹管理空中花园的各项事宜。',
      '议会下设行政院、监察院、司法庭、外交院等机构，分管各个领域的事务；空中花园军部的一切重大决策亦需受到议会管制。高算力人工智能“格式塔”协助收集全城居民的意见、规划可行方案，供议会评审与执行。',
      '自黄金时代起，议会成员结构历经多轮变迁，其间不免混入与大多数民众利益相悖的势力，但“领导全人类前进、保证文明存续”的职责与地位始终未变。现任议长为哈桑，与军部总司令尼科拉自幼相识、同心同德。',
    ],
    meta: [
      { label: '现任议长', value: '哈桑' },
      { label: '辅助智能', value: '格式塔' },
      { label: '军部关系', value: '重大决策受议会管制' },
    ],
    figures: [
      { name: '特里尔德', role: '首任议长', img: '/media/wiki/p-terry.png' },
      { name: '哈桑', role: '议长', img: '/media/wiki/p-hassan.png' },
      { name: '赛利卡', role: '议长秘书', img: '/media/wiki/p-celica.png' },
      { name: '灰鸦指挥官', role: '于某一未来代任议长', img: '/media/wiki/p-commandant.png' },
    ],
    sections: [
      {
        title: '下属机构',
        items: ['行政院', '司法庭', '监察院', '外交院'],
        links: [
          { label: '监察院', id: 'oversight' },
          { label: '外交院', id: 'foreign' },
        ],
      },
      {
        title: '决策',
        paras: [
          '议会在人力运营之外，借助格式塔收集全空中花园的居民意见、协助决策。格式塔亦可自行规划可行方案并给出建议，以供议会评审和执行。',
          '议长之性质更如同人类的精神领袖，亦是实际意义上的人类领袖。',
        ],
      },
    ],
    related: [
      { label: '监察院', id: 'oversight' },
      { label: '外交院', id: 'foreign' },
      { label: '空中花园军部', id: 'military' },
    ],
  },
  {
    id: 'oversight',
    name: '监察院',
    crumb: '监察院',
    latin: 'Oversight Bureau',
    kind: '政治机构',
    tagline: '确保议会行动不脱离正轨的监察机构。',
    lead: [
      '一个实力不俗的监察机构。它只对哈桑议长汇报，许多任务连议长秘书也无法详细过问。',
    ],
    meta: [
      { label: '最高负责人', value: '希尔达' },
      { label: '高层成员', value: '伊什梅尔' },
      { label: '成员', value: '拉斯蒂' },
    ],
    figures: [
      { name: '希尔达', role: '最高负责人', img: '/media/wiki/p-hilda.png' },
      { name: '伊什梅尔', role: '高层成员', img: '/media/wiki/p-ishmael.png' },
      { name: '拉斯蒂', role: '成员', img: '/media/wiki/p-rusty.png' },
    ],
    sections: [
      {
        title: '职能',
        items: [
          '在世界政府议会上，确保议会行动符合人类集体利益、不脱离正轨；议案通过后，司法庭拟定的草案需交由监察院备案。',
          '有权审讯重大战役涉及的关键人员，并可对被调查对象的行动、记忆进行调查，实施有固定时限的临时控制。',
          '负责调查事情真相，辅助司法庭判决，可根据相关条例介入其他部门的检查。',
          '任务保密层级极高时，特殊情况下会派遣人员介入监督工作。',
          '掌握动态图形密码，与议会其余四大部门、科学理事会共同参与格式塔的接触与日常维护。',
        ],
      },
      {
        title: '他人评价',
        quote: '“……监察厅那些人总是奇奇怪怪的，他们只对哈桑议长汇报，一部分任务我也没办法详细过问。”',
      },
      {
        title: '事件 · 对于二十一号',
        paras: [
          '异灾区事件结束后，21号因未经授权解开机体限制而被监察院盯上。在调查得出最终结果之前，三头犬小队的队员只能在小队休息室附近有限的区域内待机。',
        ],
      },
    ],
    related: [
      { label: '联合世界政府议会', id: 'council' },
      { label: '清理部队', id: 'purge' },
      { label: '“高塔”', id: 'tower' },
    ],
  },
  {
    id: 'foreign',
    name: '外交院',
    crumb: '外交院',
    latin: 'Foreign Affairs',
    kind: '政治机构',
    tagline: '处理空中花园对外事务的机构。',
    lead: ['负责处理空中花园的外交事务。'],
    meta: [{ label: '议员', value: '李斯特' }],
    figures: [{ name: '李斯特', role: '议员', img: '/media/wiki/p-lister.png' }],
    sections: [
      {
        title: '职能',
        items: [
          '司法庭拟定的草案经监察院备案后，需由外交院确认，再递交议长签字。',
          '代表空中花园与遗忘者、九龙等势力联系，邀请其参加世界政府会议、签订相关条约。',
          '组织空中花园与其他势力的联络与谈判。',
          '掌握认证卡，与议会其余四大部门、科学理事会共同参与格式塔的接触与日常维护。',
          '与行政院共同组织新闻发布会。',
        ],
      },
      {
        title: '议案流程',
        items: ['司法庭拟定草案', '监察院备案', '外交院确认', '议长签字'],
      },
    ],
    related: [
      { label: '联合世界政府议会', id: 'council' },
      { label: '监察院', id: 'oversight' },
    ],
  },
  {
    id: 'military',
    name: '空中花园军部',
    crumb: '军部',
    latin: 'Army Command',
    kind: '军事机构',
    emblem: '/media/wiki/military.png',
    tagline: '对一切以联合世界政府名义进行的对地行动拥有最高指挥权。',
    lead: [
      '自人类之子进入反击时代以来，为实现收复故土、重返家园的大业，空中花园军部持续向地面投放作战部队，以应对感染体、异合生物、升格者、红潮等一切类型的帕弥什灾难。',
      '军部拥有对一切以联合世界政府名义进行的对地行动的最高指挥权：派遣执行部队进行常规作战与勘探，派遣清理部队清理战场、追捕危险人员，派遣工程部队施工与维护，派遣支援部队运输与救援，并为艺术协会的考古勘探提供护航。',
      '现任军部总司令为尼科拉，参谋部参谋长为维尔斯。这位有过黑野履历的老战士，以超前的大局视野、灵敏的政治嗅觉与雷霆手段，成为维系空中花园局势稳定的关键人物。',
    ],
    meta: [
      { label: '总司令', value: '尼科拉' },
      { label: '参谋长', value: '维尔斯' },
      { label: '直属力量', value: '总司令专属通信频道小队' },
    ],
    figures: [
      { name: '尼科拉', role: '军部总司令', img: '/media/wiki/p-nikola.png' },
      { name: '维尔斯', role: '参谋部参谋长', img: '/media/wiki/p-wells.png' },
    ],
    sections: [
      {
        title: '涉及组织',
        items: ['司令部', '参谋部', '法奥斯军事学院', '执行部队', '清理部队', '工程部队', '支援部队', '战略外交科'],
        links: [
          { label: '参谋部', id: 'staff' },
          { label: '法奥斯军事学院', id: 'fos' },
          { label: '执行部队', id: 'taskforce' },
          { label: '清理部队', id: 'purge' },
          { label: '工程部队', id: 'engineering' },
          { label: '支援部队', id: 'support' },
        ],
      },
      {
        title: '总司令',
        paras: [
          '尼科拉拥有众多直属于个人的小队。这些人的编制通常混淆在执行部队或清理部队当中，深得信任者会拥有与总司令直接沟通的专属通信频道，避开一切中间环节。',
          '在不便以空中花园名义公开行动的情况下，尼科拉便会派出这些最信任的私兵，执行见不得光的作战、探索、缉拿与回收任务。有他坐镇军部，议会才没有成为黑野氏集团的“一言堂”。',
        ],
      },
    ],
    related: [
      { label: '联合世界政府议会', id: 'council' },
      { label: '法奥斯军事学院', id: 'fos' },
      { label: '执行部队', id: 'taskforce' },
    ],
  },
  {
    id: 'staff',
    name: '参谋部',
    crumb: '参谋部',
    latin: 'General Staff',
    kind: '军事机构',
    tagline: '制定最详细的计划，让人类尽可能得到正确的结果。',
    lead: [
      '空中花园议会的下设机构，司令部下属部门，统率执行、清理、工程、支援部队等，帮助空中花园提前应对一切可能到来的危机。',
    ],
    meta: [
      { label: '参谋长', value: '维尔斯' },
      { label: '成员', value: '汉斯' },
    ],
    figures: [
      { name: '维尔斯', role: '参谋长', img: '/media/wiki/p-wells.png' },
      { name: '汉斯', role: '成员', img: '/media/wiki/p-hans.png' },
    ],
    sections: [
      {
        title: '职责',
        items: [
          '制定最详细的计划，让人类尽可能地得到正确的结果。',
          '作为司令部下属部门，与军方联系紧密，可以调遣执行部队。',
          '负责各小队的人员变动。',
          '对关键情报享有优先权。',
          '主要考验战略战术理论水平。',
        ],
      },
      {
        title: '记录',
        paras: [
          '原世界线中，军方曾派出参谋部加入议会设立的临时部门，参与空中花园的修复善后工作，维尔斯参谋长担任该部门副主管。',
          '由于汉斯不再适合高强度工作，议会决定将其转任至参谋部，进行构造体战术的开发。',
        ],
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '执行部队', id: 'taskforce' },
    ],
  },
  {
    id: 'fos',
    name: '法奥斯军事学院',
    crumb: '法奥斯军事学院',
    latin: 'F.O.S. Military Academy',
    kind: '军事院校',
    emblem: '/media/wiki/fos.png',
    tagline: '为执行部队培养指挥官的军事学校，也是人类培育反击力量的“母港”。',
    lead: [
      '法奥斯军事指挥学校，隶属于世界政府的军事学校，负责为执行部队培养能够指挥构造体的指挥官。',
      '学院可容纳三千名常驻学员，配备独立的能源循环系统、全密封生存仓库，以及可在极端条件下维持十五年自主运转的基础设施。和平之时，它帮助学子建设世界、开拓星海；灾难降临之际，法奥斯便是人类培育反击力量的“母港”。',
    ],
    meta: [
      { label: '校徽铭文', value: 'ΦΑΟΣ · 光' },
      { label: '常驻学员', value: '3000' },
      { label: '校歌', value: '《长路归航》' },
    ],
    figures: [
      { name: '库洛姆', role: '首席毕业生', img: '/media/wiki/p-kulom.png' },
      { name: '灰鸦指挥官', role: '首席毕业生', img: '/media/wiki/p-commandant.png' },
      { name: '希卡', role: '首席毕业生', img: '/media/wiki/p-xika.png' },
      { name: '西蒙', role: '毕业生', img: '/media/wiki/p-simon.png' },
      { name: '凡妮莎', role: '毕业生', img: '/media/wiki/p-vanessa.png' },
      { name: '哈里乔', role: '毕业生', img: '/media/wiki/p-harjo.png' },
    ],
    sections: [
      {
        title: '教学',
        items: [
          '采用 Gestalt 课堂抽选系统对学生进行考核。',
          '每次毕业典礼与入学典礼，学院都会邀请战功卓越的校友演讲，动员新生。',
        ],
      },
      {
        title: '区域',
        items: [
          '训练场、食堂、休息厅',
          '图书馆：藏有大量黄金时代遗留下来的书籍，其中不少来自艺术协会的捐赠；一些在公共基础教育中心无法查阅的书刊，在这里能找到原本。',
          '军事医学研究院：曾发表《构造体研究基础理论》，似乎有着不为大众所知的东西。',
        ],
      },
      {
        title: '法奥斯之矛',
        paras: [
          '法奥斯之矛（Spear of FOS）战术界面，是学院的战术环境模拟系统。它将指挥官面前的信息尽可能转译成可直接理解的情报，并给出战术评估与建议；若现场允许与空中花园直接连接，还能提供额外的附加功能。',
        ],
      },
      {
        title: '历史',
        quote: '电子坐标会被空间阻隔，只有……才能作为锚点，循着…的轨迹返航。',
        paras: [
          '早期法奥斯学院位于地表。一次意外事故中，法奥斯纪念碑倒塌，校长本想在星舰上复刻一座缩小的纪念碑，多米尼克却力排众议，主张将纪念碑的上半段原样迁移到法奥斯星舰，并留下上面那句话。',
          '帕弥什爆发后，学院迁移至空中花园。后来在艾丝琳与命运之轮的合作下，法奥斯“掉”了下来。',
        ],
      },
      {
        title: '寓意',
        paras: ['法奥斯图标下方的“ΦΑΟΣ”为希腊语缩写，意为“光”。'],
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '执行部队', id: 'taskforce' },
    ],
  },
  {
    id: 'taskforce',
    name: '执行部队',
    crumb: '执行部队',
    latin: 'Task Force',
    kind: '军事机构',
    tagline: '由人类指挥官与构造体组成，是空中花园对抗帕弥什病毒的中坚力量。',
    lead: [
      '又名执行者部队、执行小队，一般由人类指挥官与构造体组成，是空中花园对抗帕弥什病毒的中坚力量。',
      '各小队承担侦察、突击、斩首、特勤、保育区防卫等不同职责，编制与任务内容大多属于机密。',
    ],
    meta: [
      { label: '人员构成', value: '人类指挥官 + 构造体' },
      { label: '代表小队', value: '灰鸦小队' },
      { label: '隶属', value: '空中花园军部' },
    ],
    sections: [
      {
        title: '小队一览',
        squads: [
          {
            name: '旧灰鸦小队',
            desc: '全由新队员组成的五人精英小队。在首席成为战地指挥官前，灰鸦业已成立，队员间感情深厚。',
            members: '指挥官 雷文治 · 队长 阿尔法 · 穆罗尔 · 迅 · 希罗',
            portraits: [{ name: '阿尔法', img: '/media/wiki/p-alpha.png' }],
          },
          {
            name: '灰鸦小队',
            desc: '空中花园英雄小队，名声响亮的传奇小队。队长露西亚身经百战，里、丽芙先后入队。',
            members: '灰鸦指挥官 · 露西亚 · 里 · 丽芙',
            img: '/media/wiki/sq-gray-raven.png',
            portraits: [
              { name: '灰鸦指挥官', img: '/media/wiki/p-commandant.png' },
              { name: '露西亚', img: '/media/wiki/p-lucia.png' },
              { name: '里', img: '/media/wiki/p-lee.png' },
              { name: '丽芙', img: '/media/wiki/p-liv.png' },
            ],
          },
          {
            name: '突击鹰小队',
            desc: '执行部队下属斥候小队，主要负责地面侦察。成员均为构造体，单兵作战能力极强，常分散在世界各地执行最危险的斥候工作。',
            members: '库洛姆 · 神威 · 万事 · 卡穆',
            img: '/media/wiki/sq-assault-eagle.png',
            portraits: [
              { name: '库洛姆', img: '/media/wiki/p-kulom.png' },
              { name: '神威', img: '/media/wiki/p-kamui.png' },
              { name: '万事', img: '/media/wiki/p-wanshi.png' },
              { name: '卡穆', img: '/media/wiki/p-kamu.png' },
            ],
          },
          {
            name: '三头犬小队',
            desc: '特殊作战小队，由尼科拉单独委派任务，指挥官莫瑞远程链接指挥，队长薇拉拥有极大的临场处置权。',
            members: '莫瑞 · 薇拉 · 21号 · 诺克提',
            img: '/media/wiki/sq-cerberus.png',
            portraits: [
              { name: '莫瑞', img: '/media/wiki/p-morey.png' },
              { name: '薇拉', img: '/media/wiki/p-vera.png' },
              { name: '21号', img: '/media/wiki/p-21.png' },
              { name: '诺克提', img: '/media/wiki/p-nokti.png' },
            ],
          },
          {
            name: '圣甲虫小队',
            desc: '受尼科拉直属管辖，负责紧急处理指挥部特勤任务，是司令操纵下的“影子”之一。',
            members: '瓦莱莉亚 · 修特罗尔 · 八咫 · 希瓦 · 斜奏',
            img: '/media/wiki/sq-scarab.png',
            portraits: [
              { name: '瓦莱莉亚', img: '/media/wiki/p-valeria.png' },
              { name: '修特罗尔', img: '/media/wiki/p-shutror.png' },
              { name: '八咫', img: '/media/wiki/p-yazhi.png' },
              { name: '希瓦', img: '/media/wiki/p-xiva.png' },
              { name: '斜奏', img: '/media/wiki/p-xiezou.png' },
            ],
          },
          {
            name: '清庭白鹭小队',
            desc: '以战略部署闻名，凭借极高的效率与极低的损伤率受到军方嘉奖；地面作战更利于其战术展开。',
            members: '凡妮莎 · 邦比娜塔 · 忒修 · 丽芙 · 莱亚 · 黑野澪',
            img: '/media/wiki/sq-egret.png',
            portraits: [
              { name: '凡妮莎', img: '/media/wiki/p-vanessa.png' },
              { name: '邦比娜塔', img: '/media/wiki/p-bonbinata.png' },
              { name: '忒修', img: '/media/wiki/p-thexio.png' },
              { name: '丽芙', img: '/media/wiki/p-liv.png' },
              { name: '莱亚', img: '/media/wiki/p-leia.png' },
              { name: '黑野澪', img: '/media/wiki/p-heiyeming.png' },
            ],
          },
          {
            name: '衔尾蛇小队',
            desc: '直属于尼科拉司令，似乎永远不缺任务，但没有人知道他们执行的到底是什么。',
            members: '帕莱克斯 · 诺瓦尔',
          },
          {
            name: '丘鹬小队',
            desc: '小队成员包括特洛与哈里乔。',
            members: '特洛 · 哈里乔',
            portraits: [
              { name: '特洛', img: '/media/wiki/p-teluo.png' },
              { name: '哈里乔', img: '/media/wiki/p-harjo.png' },
            ],
          },
          {
            name: '寒羊小队',
            desc: '经历过第三次重组。',
            members: '西蒙 · 帕露玛 · 诺安 · 莉莲 · 提法',
            img: '/media/wiki/sq-cold-sheep.png',
            portraits: [
              { name: '西蒙', img: '/media/wiki/p-simon.png' },
              { name: '帕露玛', img: '/media/wiki/p-paluma.png' },
              { name: '诺安', img: '/media/wiki/p-noan.png' },
              { name: '莉莲', img: '/media/wiki/p-lilian.png' },
              { name: '提法', img: '/media/wiki/p-tifa.png' },
            ],
          },
          {
            name: '朱雀小队',
            desc: '与灰鸦几乎同时组建完毕，指挥官是灰鸦指挥官的同届。朱雀小队已全员牺牲。',
            members: '提法',
            portraits: [{ name: '提法', img: '/media/wiki/p-tifa.png' }],
          },
          {
            name: '地狱犬小队',
            desc: '行事风格与三头犬相似，连队名都在模仿三头犬；队长是三头犬队长薇拉的狂热追逐者之一。',
          },
          {
            name: '雨燕小队',
            desc: '曾由指挥官希卡率领，因未能达到精英小队应有的作战效率而被解散，队员被分配至不同小队。',
            members: '希卡',
            portraits: [{ name: '希卡', img: '/media/wiki/p-xika.png' }],
          },
          {
            name: '山枭小队',
            desc: '档案中未留下更多可考的记录。',
          },
          {
            name: '虹莺小队',
            desc: '在艺术协会协助下成立的特殊小队，代号“虹莺”（Iris，鸢尾花与伊莉斯的同义）。后因莱娜失踪被处以“无限期停止活动”，编制在艾伦的努力下得以保留。',
            members: '希卡 · 莱娜 · 艾拉 · 特洛伊',
            img: '/media/wiki/sq-iris.png',
            portraits: [
              { name: '希卡', img: '/media/wiki/p-xika.png' },
              { name: '莱娜', img: '/media/wiki/p-laina.png' },
              { name: '艾拉', img: '/media/wiki/p-aila.png' },
              { name: '特洛伊', img: '/media/wiki/p-troy.png' },
            ],
          },
          {
            name: '刺螳小队',
            desc: '曾驻守异合森林周边的保育区。抵抗异合生物袭击时，穆尔为救下克罗瓦而牺牲。',
            members: '穆尔',
            portraits: [{ name: '穆尔', img: '/media/wiki/p-muer.png' }],
          },
          {
            name: '银隼小队',
            desc: '空中花园精锐小队。保护112号保育区的常规任务结束后，却被登记为全员阵亡。',
          },
          {
            name: '翼角鹿小队',
            desc: '直接接受尼科拉的命令，着重追踪、卧底这样的特殊任务。',
          },
          {
            name: '啮齿鼠小队',
            desc: '不擅长作战。',
          },
          {
            name: '盖亚象小队',
            desc: '档案中未留下更多可考的记录。',
          },
        ],
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '清理部队', id: 'purge' },
      { label: '工程部队', id: 'engineering' },
      { label: '支援部队', id: 'support' },
    ],
  },
  {
    id: 'engineering',
    name: '工程部队',
    crumb: '工程部队',
    latin: 'Engineering Corps',
    kind: '军事机构',
    emblem: '/media/wiki/engineering.png',
    tagline: '隶属于寰宇技师工会的非战斗部队，负责建设、修复与维护。',
    lead: [
      '隶属于寰宇技师工会的非战斗部队，主要负责建设、修复、设备维护等后勤工作，以及机械工程技术的研发任务。',
    ],
    meta: [
      { label: '队长', value: '卡列尼娜' },
      { label: '副队长', value: '布偶熊' },
      { label: '隶属', value: '寰宇技师工会' },
    ],
    figures: [
      { name: '卡列尼娜', role: '队长', img: '/media/wiki/p-karenina.png' },
      { name: '布偶熊', role: '副队长', img: '/media/wiki/p-bear.png' },
    ],
    sections: [
      {
        title: '下设两个组',
        items: [
          '维护组：在空中花园从事维护作业。',
          '重建组：大部分时间驻守地表，进行重建作业。',
        ],
      },
      {
        title: '补充',
        items: [
          '技术研发：在人手紧缺时也会承担机械工程技术研发，例如研究新型发动机。',
          '罗塞塔在加入空中花园后，便进入了工程部队。',
        ],
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '寰宇技师工会', id: 'guild' },
      { label: '支援部队', id: 'support' },
    ],
  },
  {
    id: 'purge',
    name: '清理部队',
    crumb: '清理部队',
    latin: 'Purge Corps',
    kind: '军事机构',
    emblem: '/media/wiki/purge.png',
    tagline: '以“沉默的注视”镇守最基础的律法底线。',
    lead: [
      '表面任务是打扫战场、负责善后；实际上，暗地里还承担着处决感染构造体、叛逃构造体，甚至人类指挥官的任务。小队编制不明，实力比执行部队更强。在清理部队中，感情和羁绊是需要避讳的东西。',
      '在一些重大战役中，清理部队的成员会混在执行者部队中督战，以便第一时间发现潜在的叛逃者。',
    ],
    meta: [
      { label: '现任队长', value: '比安卡' },
      { label: '前队长', value: '巴拉德' },
      { label: '原则', value: '沉默的注视' },
    ],
    figures: [
      { name: '比安卡', role: '队长', img: '/media/wiki/p-bianca.png' },
      { name: '巴拉德', role: '前队长', img: '/media/wiki/p-ballard.png' },
      { name: '千子', role: '前副队长', img: '/media/wiki/p-chiko.png' },
      { name: '伊萨琉斯', role: '队员', img: '/media/wiki/p-isaurius.png' },
      { name: '西尔芙', role: '队员', img: '/media/wiki/p-sylph.png' },
      { name: '斜奏', role: '前队员', img: '/media/wiki/p-xiezou.png' },
      { name: '奈捷尔', role: '前队员', img: '/media/wiki/p-nazier.png' },
      { name: '卡列尼娜', role: '外援', img: '/media/wiki/p-karenina.png' },
    ],
    sections: [
      {
        title: '职能',
        items: [
          '配合军方或其他部门抓捕叛逃者、肃清感染体，并配合监察院暗中清查越界行为。',
          '早在黄金时代便已成立，用于保持局势稳定，是世界政府公信力的象征。',
          '在帕弥什爆发前期职能广泛：打击末日言论、人口买卖、非法交易，捣毁以世界政府名义建立的非人道实验窝点。',
          '主要职责是追捕叛逃构造体，以杜绝叛逃或放弃任务致使执行部队军心溃散。',
          '常与工程部队一起行动，擅长追猎；并没有直接调用坐标信息的权限，仅在任务需求时开放对应情报。',
        ],
      },
      {
        title: '原则',
        quote: '清理部队的原则及队标的含义，是“沉默的注视”。',
        paras: [
          '由于编制的特殊性，一般小队不会与清理部队有所接触。清楚其存在的，只有一些服役时间较长的构造体——比如长期进行协助工作、没有经历过重启的支援部队。',
        ],
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '监察院', id: 'oversight' },
      { label: '执行部队', id: 'taskforce' },
    ],
  },
  {
    id: 'support',
    name: '支援部队',
    crumb: '支援部队',
    latin: 'Support Corps',
    kind: '军事机构',
    emblem: '/media/wiki/support.png',
    tagline: '负责地面行动的后勤与支援。',
    lead: [
      '空中花园下属支援部队，负责地面行动的后勤与支援。主要负责人为布丽姬特，队员称呼她为“大姐头”。',
    ],
    meta: [
      { label: '主要负责人', value: '布丽姬特' },
      { label: '职能', value: '运输 · 补给 · 救援' },
    ],
    sections: [
      {
        title: '行动记录',
        items: [
          '九龙环城战役中，在平民区阵地为先锋驻守的E分队提供支援。',
          '主线13章，灰鸦小队刚降落至075号城市时，为其提供防护服、补给及逆元装置的强化。',
          '“跨越连接桥”行动中，为无法升起连接桥的灰鸦一行提供短途喷射飞行装置。',
          '聚噬体被摧毁、地下空洞坍塌后，支援部队及时赶到，利用绳枪救上露西亚与指挥官。',
        ],
      },
      {
        title: '关前评价',
        quote: '无论在看得见的地方还是看不见的地方，支援部队永远都在工作。',
      },
    ],
    related: [
      { label: '空中花园军部', id: 'military' },
      { label: '执行部队', id: 'taskforce' },
    ],
  },
  {
    id: 'science',
    name: '科学理事会',
    crumb: '科学理事会',
    latin: 'Science Council',
    kind: '科研单位',
    emblem: '/media/wiki/science.png',
    tagline: '黄金时代以来人类最高科研机构，世界政府“信任的磐石”。',
    lead: [
      '黄金时代以来人类最高科研机构，曾在首席技官多米尼克的领导下，构成世界政府“信任的磐石”，推动人类科学与进步。现任首席技官为阿西莫夫。',
      '冷核聚变、格式塔、零点能反应堆、空中花园与构造体理论——科学理事会和它的科学奇迹缔造了黄金时代应有的面貌，直到今天也是如此。',
    ],
    meta: [
      { label: '现任首席技官', value: '阿西莫夫' },
      { label: '创始人', value: '多米尼克' },
      { label: '理念', value: '向世界平等分享研究成果' },
    ],
    sections: [
      {
        title: '部门',
        items: [
          '科研一部：偏向理论与基础科学，负责科学研究的主要部门。',
          '科研二部：更多经手天体物理与星际工程学，研究核心在于维持空中花园的运行——大至引擎，小至维修。',
          '第三开发部：为格式塔计划成立的临时部门，由朗道领导，格式塔完成后被裁撤分拆。',
          '第四开发部：负责研发武器装备的临时部门，领导者为维克多·杰克森教授。',
          '科学理事会伦理委员会：负责科研伦理审查，有权削减私自进行非法实验的学者。',
        ],
      },
      {
        title: '历史',
        items: [
          '起源：黄金时代之前，理事会只是各地科研工作者自发成立的松散无国界组织；多米尼克统合早期科学家，成立了如今熟知的科学理事会。',
          '黄金时代：多米尼克联合全球顶尖科研人才带领人类走出“大低谷”；精英成员主导研发超级AI格式塔，并在其帮助下推进星际航行与机械意识实验。',
          '免疫时代：病毒爆发后，理事会第一时间展开全方位调查。',
          '反击时代：深入研究意识海技术、思维信标、特化机体、Ω装置等军事技术与帕弥什生态。',
        ],
      },
      {
        title: '园区',
        paras: [
          '黄金时代科学理事会所在地，包含地上的科研园区和地下的格式塔深井与科研城。园区餐厅是一座折中主义风格的三层小楼，在数百年后的今天已属老古董。',
        ],
      },
      {
        title: '领导项目',
        items: ['格式塔计划', '东方计划、伊甸计划', '“史匹策”望远镜阵列'],
      },
      {
        title: '伦理通告',
        quote: '科学理事会始终反对非人道人体实验。任何团体、组织、机构和个人不得以强制或非强制的手段，要求任何自然人参加未经科学理事会准许的活体或非活体人体实验。',
        paras: [
          '因私自展开严重悖于人类道德底线的非人道实验，理事会决定除名伯纳德·葛德文博士。在科学理事会，除名是最重的惩治措施。',
        ],
      },
    ],
    related: [
      { label: '生命之星', id: 'life' },
      { label: '月面基地', id: 'moon' },
    ],
  },
  {
    id: 'life',
    name: '生命之星',
    crumb: '生命之星',
    latin: 'Star of Life',
    kind: '医疗单位',
    emblem: '/media/wiki/life-star.png',
    tagline: '空中花园的医疗机构，负责人类治疗与构造体治疗。',
    lead: [
      '空中花园的医疗机构，负责人类治疗、构造体治疗等事务。',
      '其徽记取自紧急医疗救护服务系统的国际标志“生命之星”，六角各代表一项救护功能；共同体图标保留了相似的造型，只对中间的灵蛇权杖作了改动。',
    ],
    meta: [
      { label: '性质', value: '医疗共同体' },
      { label: '职能', value: '人类治疗 · 构造体治疗' },
      { label: '徽记', value: '六角生命之星' },
    ],
    figures: [
      { name: '希波克拉底', role: '退休教授', img: '/media/wiki/p-hippocrates.png' },
      { name: '黑野苦川', role: '医生', img: '/media/wiki/p-kurogawa.png' },
      { name: '万事', role: '曾任医生', img: '/media/wiki/p-wanshi.png' },
    ],
    sections: [
      {
        title: '生命之星',
        paras: [
          '生命之星（Star of Life）是紧急医疗救护服务系统的国际标志，常见于救护车、救护直升机、救护器材与救护技术员制服。',
        ],
        items: [
          '六个角分别代表：伤病患检视、报告、救护车出勤、现场处置、运送途中照顾、运送至特定医疗单位。',
        ],
      },
    ],
    related: [{ label: '科学理事会', id: 'science' }],
  },
  {
    id: 'arts',
    name: '艺术协会',
    crumb: '艺术协会',
    latin: 'World Government Art Association',
    kind: '其它组织',
    emblem: '/media/wiki/arts.png',
    tagline: '保存人类全部已记录的艺术，也把艺术还给大众。',
    lead: [
      '空中花园艺术协会（World Government Art Association），聚集着各流派知名艺术家，保存着人类史上所有已记录的艺术作品，被标榜为未来艺术诞生的摇篮。',
    ],
    meta: [
      { label: '会长', value: '艾伦' },
      { label: '所属', value: '联合世界政府' },
      { label: '下属', value: '考古小队' },
    ],
    figures: [
      { name: '艾伦', role: '会长', img: '/media/wiki/p-allen.png' },
      { name: '赛琳娜', role: '成员', img: '/media/wiki/p-selena.png' },
      { name: '艾拉', role: '成员', img: '/media/wiki/p-ayla.png' },
      { name: '蕾奥妮', role: '成员', img: '/media/wiki/p-leonie.png' },
    ],
    sections: [
      {
        title: '官方设定',
        paras: [
          '在会长艾伦的带领下，艺术协会主导着艺术领域的方方面面。当今的艺术形式大都以高新为主调，兼具艺术与科技感。在战争岁月里，这群走在艺术最前沿的“领航者”用多元化的作品滋养着人们干涸的精神世界。',
          '协会的前进道路上遍布非议与赞扬，但这并不妨碍他们秉持“艺术是大众的”这一观点，将艺术普及到生活的各个角落。协会同时也是旧时代文艺复兴的最大推手：正因为下属考古小队的不懈努力，黄金时代的艺术作品才没有在战火中遗失。',
        ],
      },
      {
        title: '理念',
        quote: '对自地球诞生的所有艺术进行收复、复原、继承而后发扬。',
      },
    ],
    related: [{ label: '联合世界政府议会', id: 'council' }],
  },
  {
    id: 'guild',
    name: '寰宇技师工会',
    crumb: '寰宇技师工会',
    latin: 'Universal Technicians Guild',
    kind: '其它组织',
    tagline: '负责空中花园绝大部分机械设计、制造与维护的中立组织。',
    lead: [
      '以各种机械技师为主要成员的中立性组织，负责空中花园的绝大部分机械设计、制造以及维护。',
      '其前身寰宇重工是黄金时代最大的工业承包商，大型建筑与人工智能多由其生产研发，免疫时代的空气过滤塔也由它建造。阿卡狄亚撤退后，绝大多数人员进入空中花园，继续为收复地球出力。',
    ],
    meta: [
      { label: '前身', value: '寰宇重工' },
      { label: '性质', value: '中立技师组织' },
      { label: '业务', value: '机械设计 · 制造 · 维护' },
    ],
    figures: [
      { name: '卡列尼娜', role: '工程部队', img: '/media/wiki/p-karenina.png' },
      { name: '布偶熊', role: '工程部队', img: '/media/wiki/p-bear.png' },
      { name: '怀斯', role: '相关人物', img: '/media/wiki/p-wise.png' },
      { name: '麦卡', role: '相关人物', img: '/media/wiki/p-maca.png' },
    ],
    sections: [
      {
        title: '沿革',
        items: [
          '黄金时代：寰宇重工是最大的工业承包商，产能强大，各种大型建筑和人工智能皆由其生产研发。',
          '免疫时代：负责建造空气过滤塔。',
          '阿卡狄亚撤退后：绝大多数人员进入空中花园，继续为人类收复地球献出力量。',
          '现在：负责生产科学理事会委托的各种军用武器装备与量产型构造体零部件。',
        ],
      },
      {
        title: '传闻',
        paras: ['寰宇重工早期的大多数产品，相传都是根据达芬奇的手稿制作完成的。'],
      },
    ],
    related: [
      { label: '工程部队', id: 'engineering' },
      { label: '科学理事会', id: 'science' },
    ],
  },
  {
    id: 'moon',
    name: '月面基地',
    crumb: '月面基地',
    latin: 'Lunar Base',
    kind: '其它组织',
    emblem: '/media/wiki/moon.png',
    tagline: '建于月球表面的星舰与零点能基地，如今由诺曼矿业集团管理。',
    lead: [
      '黄金时代建于月球表面的基地，原用于星舰生产与组装；“伊甸计划”启动后，被用于测试零点能反应堆在低重力与宇宙环境中的运作情况，并建造伊甸Ⅱ型殖民舰。',
      '病毒爆发后，基地长期处于半废弃状态，最终将使用权与管理事务交给在月面经营采矿业务的诺曼矿业集团。空晓界限后被修复，用于量产Ω武器。',
    ],
    meta: [
      { label: '管理权', value: '诺曼矿业集团' },
      { label: '用途', value: '星舰组装 · 零点能测试' },
      { label: '现状', value: '修复后量产Ω武器' },
    ],
    sections: [
      {
        title: '设施',
        items: [
          '零点能反应堆：预备作为空中花园的能量来源，以驱动重力波引擎。',
          '零点能引擎：理论上可实现超光速航行，专为应用零点能设计，无法兼容常规能源，因此与反应堆一同留在了月面。',
          '大型Ω武器：黑野囚禁露娜时，为预防她反抗而设的保险措施。',
        ],
      },
      {
        title: '历史沿革',
        items: [
          '伊甸计划第五年（约2152年）：月球基地开启改造工程，以研制、组装可搭载零点能引擎的伊甸Ⅱ型。',
          '第六年（2153年）：改造基本完成，额外增设零点能引擎试验场。',
          '第十四年（2159年）：伊甸Ⅱ型在月面组装完成，搭载临时冷核聚变引擎升空，停泊于月球同步轨道等待零点能引擎完工。',
          '反击时代：卡农利用真空零点能反应堆制造少量帕弥什病毒、研究逆元装置，后因病毒失控，基地从此废弃。',
          '其后：诺曼矿业集团长期在月球开采氦-3，供空中花园日常消耗与物资交换；卡列尼娜与布偶熊为制造Ω武器重返月面，零点能反应堆成功运行。',
          '最终：反应堆引擎被帕弥什感染，不断释放重力波。世界政府同意将其毁掉，卡列尼娜击败了与引擎融合的异合生物。',
        ],
      },
    ],
    related: [{ label: '科学理事会', id: 'science' }],
  },
  {
    id: 'tower',
    name: '“高塔”',
    crumb: '高塔',
    latin: 'The Tower',
    kind: '其它组织',
    tagline: '以“净化质疑、捍卫人类”为宗旨，隐藏在空中花园的神秘组织。',
    lead: [
      '以“净化质疑、捍卫人类”为宗旨的隐藏在空中花园的神秘组织，与生命树计划息息相关。',
    ],
    meta: [
      { label: '宗旨', value: '净化质疑 · 捍卫人类' },
      { label: '关联', value: '生命树计划' },
      { label: '联络', value: '与世界政府监察院保持联系' },
    ],
    figures: [{ name: '拉斯蒂', role: '疑似联络人', img: '/media/wiki/p-rusty.png' }],
    sections: [
      {
        title: '设定',
        items: [
          '自称“高塔”，是御衡时代的灯火，也是规制文明、避免人类坠入深渊的枷锁。',
          '对生命树计划了如指掌，疑似策划者、参与者与毁灭者，并熟知多米尼克的遗产。',
          '与世界政府监察院保持联系，手眼通天；疑似推动了卡赫季大爆炸事件，并掩盖了真相。',
        ],
      },
      {
        title: '经历',
        items: [
          '针对涅缇娅设置全球表彰的“测验”，检测她对人类文明的忠顺，并轻易摆平了她的抗争。',
          '与拉斯蒂沟通的人疑似为“高塔”，其对“质点”、“生命树”、“多米尼克的遗产”非常了解。',
        ],
      },
    ],
    related: [{ label: '监察院', id: 'oversight' }],
  },
];
