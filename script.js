// ==================== 振动与来电 ====================
function vibrateDevice(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch(e){} }
}

function triggerCallStorm(count = 5, callerName = '她') {
    let currentCall = 0;
    const overlay = document.getElementById('incoming-call-overlay');
    const counterEl = document.getElementById('call-counter');
    const callNameEl = document.getElementById('call-caller-name');
    const rejectBtn = document.getElementById('call-reject-btn');
    callNameEl.textContent = callerName;
    overlay.classList.remove('hidden');
    vibrateDevice([1000,500,1000,500]);
    function nextCall() {
        currentCall++;
        if(currentCall > count) { overlay.classList.add('hidden'); vibrateDevice(0); return; }
        counterEl.textContent = `第 ${currentCall}/${count} 次来电`;
        vibrateDevice([1000,300,1000,300]);
        const auto = setTimeout(() => {
            if(currentCall < count) setTimeout(nextCall, 1500);
            else nextCall();
        }, 3000);
        rejectBtn.onclick = () => {
            clearTimeout(auto); vibrateDevice(0); overlay.classList.add('hidden');
            setTimeout(() => { if(currentCall < count) { overlay.classList.remove('hidden'); nextCall(); } }, 1500);
        };
    }
    nextCall();
}

// ==================== 状态与人格档案 ====================
const gameState = { mental: 100, career: 100, social: 100 };
const thresholdsTriggered = { career60: false, career30: false, social60: false, social30: false };
const personalityScores = { boundary: 0, emotionalGiving: 0, compliance: 0 };

function addPersonalityScore(category, value) { personalityScores[category] += value; }

function applyConsequence(cons) {
    if(!cons) return;
    gameState.mental = Math.max(0, gameState.mental + (cons.mental || 0));
    gameState.career = Math.max(0, gameState.career + (cons.career || 0));
    gameState.social = Math.max(0, gameState.social + (cons.social || 0));
    updateStatusUI();
}

function updateStatusUI() {
    document.getElementById('mental-bar').style.width = gameState.mental + '%';
    document.getElementById('career-bar').style.width = gameState.career + '%';
    document.getElementById('social-bar').style.width = gameState.social + '%';
    const container = document.getElementById('message-container');
    if(gameState.mental < 70) container.classList.add('shaking');
    else container.classList.remove('shaking');
}

function checkThresholds() {
    const messages = [];
    if(gameState.career < 60 && !thresholdsTriggered.career60) {
        thresholdsTriggered.career60 = true;
        messages.push("同事私信：你的事院里都传开了，领导让你自己处理好。");
    }
    if(gameState.career < 30 && !thresholdsTriggered.career30) {
        thresholdsTriggered.career30 = true;
        messages.push("领导消息：你再不解决个人问题，院里要调整你的课题安排。");
    }
    if(gameState.social < 60 && !thresholdsTriggered.social60) {
        thresholdsTriggered.social60 = true;
        messages.push("朋友X：她又来骚扰我了，你能不能处理一下？");
    }
    if(gameState.social < 30 && !thresholdsTriggered.social30) {
        thresholdsTriggered.social30 = true;
        messages.push("朋友X：对不起，我也扛不住了。以后你的事别牵扯到我。");
        gameState.social = Math.max(0, gameState.social - 10);
        updateStatusUI();
    }
    messages.forEach(msg => addMessage(msg, 'system'));
}

// ==================== 剧情树（骚扰驱动妥协版） ====================
const storyNodes = {
    intro: {
        npcMessage: "你好，我在平台上看到你的资料。你也是认真想找一段纯粹感情的人吧？现在的人都太浮躁了，但你的文字让我觉得你不一样 😊",
        delay: 1500,
        choices: [
            { text: "谢谢，可以先聊聊", next: "share_story", cons: {mental:0,career:0,social:0}, personality: {emotionalGiving: 1} },
            { text: "抱歉，我暂时没兴趣", next: "reject_warm", cons: {mental:-5,career:0,social:0}, personality: {boundary: 1} }
        ]
    },
    share_story: {
        npcMessage: "我离过一次婚，有个儿子。这些年一个人带孩子、创业，真的很累。有时候想找个人说说话都找不到。你愿意听我说这些吗？",
        delay: 2500,
        systemMsg: "🎭 分享脆弱面是建立情感依赖的第一步。",
        choices: [
            { text: "当然，你挺不容易的", next: "deep_emotion", cons: {mental:-3,career:0,social:0}, personality: {emotionalGiving: 2} },
            { text: "我们刚认识，聊这些太私人了", next: "retreat_sweet", cons: {mental:-5,career:0,social:-3}, personality: {boundary: 1} }
        ]
    },
    deep_emotion: {
        npcMessage: "你真好，从来没人这么耐心听我说话。我觉得你就是我一直在等的那个人。我前夫从来不肯听我讲工作的事，但你不一样 💕",
        delay: 2500,
        systemMsg: "💞 理想化投射。",
        choices: [
            { text: "我只是做了正常人都会做的事", next: "time_request", cons: {mental:-5,career:0,social:-2}, personality: {emotionalGiving: 1} },
            { text: "我觉得你对我期待太高了", next: "time_request", cons: {mental:-8,career:0,social:-2}, personality: {boundary: 1} }
        ]
    },
    retreat_sweet: {
        npcMessage: "对不起，是我太急了。我只是很久没遇到能让我敞开心扉的人了。没关系，我们可以慢慢来。对了，你平时喜欢做什么？我最近在学做饭，真想有机会做给你尝尝 😋",
        delay: 2300,
        systemMsg: "🍬 见你后退，切换温柔模式。",
        choices: [
            { text: "你还会做饭？挺意外的", next: "time_request", cons: {mental:-3,career:0,social:0}, personality: {emotionalGiving: 1} },
            { text: "不用麻烦了，我习惯一个人", next: "time_request", cons: {mental:-5,career:0,social:0}, personality: {boundary: 1} }
        ]
    },
    time_request: {
        npcMessage: "每天和你聊天是我最开心的时候。你能不能答应我，以后每天至少陪我聊半小时？我一个人待着的时候总是胡思乱想 😔",
        delay: 2600,
        systemMsg: "⏳ 索要固定时间。",
        choices: [
            { text: "好，如果我有空的话", next: "status_request", cons: {mental:-5,career:-5,social:0}, personality: {compliance: 1} },
            { text: "我工作很忙，没法保证", next: "guilt_trip_time", cons: {mental:-10,career:0,social:-5}, personality: {boundary: 2} }
        ]
    },
    guilt_trip_time: {
        npcMessage: "我就知道，你们男人都一样。当初说想找个人说话的是你，现在嫌我烦的也是你。你知道我一个人带儿子有多难吗？你连半小时都不肯给我 💢",
        delay: 2500,
        systemMsg: "🔄 道德绑架。",
        choices: [
            { text: "我不是那个意思，好吧我尽量", next: "status_request", cons: {mental:-12,career:-8,social:-8}, personality: {compliance: 2} },
            { text: "你真的误会了，我坚持我的界限", next: "status_request_rebel", cons: {mental:-15,career:-5,social:-10}, personality: {boundary: 2} }
        ]
    },
    status_request: {
        npcMessage: "那我们算是在一起了吗？我不想玩暧昧。你如果对我没意思，就直接告诉我。但我希望你认真考虑，我这样的女人，错过就没有了。",
        delay: 2800,
        systemMsg: "💍 名分索取。",
        choices: [
            { text: "我觉得我们需要更多时间了解", next: "gift_request", cons: {mental:-8,career:-5,social:-5}, personality: {boundary: 1} },
            { text: "好吧，那就在一起试试", next: "money_step1_granted", cons: {mental:-5,career:-10,social:-10}, personality: {compliance: 3} }
        ]
    },
    status_request_rebel: {
        npcMessage: "你居然这样对我？我到底哪里不好？我为你拒绝了那么多人，你就是个没良心的。但我不会放弃的，你迟早会明白我的好 😤",
        delay: 2500,
        systemMsg: "💢 拒绝名分后愤怒纠缠。",
        choices: [
            { text: "请你冷静，我们不合适", next: "gift_request_rebel", cons: {mental:-20,career:-10,social:-10}, personality: {boundary: 2} },
            { text: "(沉默不回复)", next: "gift_request_rebel", cons: {mental:-18,career:-5,social:-10}, personality: {boundary: 1} }
        ]
    },
    // 礼物节点（索取情绪价值后的小额试探）
    gift_request: {
        npcMessage: "既然我们还在互相了解，那你愿不愿意帮我一个小忙？我看中了一条项链，不贵，就当是给我的生日礼物。你送了我，我也不会天天打电话查岗了，好不好？🎁",
        delay: 2700,
        systemMsg: "💰 以“礼物”换“减少骚扰”，开始小额物质试探。",
        choices: [
            { text: "多少钱？我给你转（买个清净）", next: "gift_accepted", cons: {mental:-5,career:-5,social:-3}, personality: {compliance: 2} },
            { text: "我觉得送礼物还太早", next: "online_harass_intro", cons: {mental:-10,career:-5,social:-5}, personality: {boundary: 2} }
        ]
    },
    gift_request_rebel: {
        npcMessage: "我不管，你必须补偿我。一条项链而已，又不贵。你买了我就原谅你，不然我天天打电话，直到你服软为止 ☎️😡",
        delay: 2600,
        systemMsg: "🎁 即使关系未确认，仍用骚扰逼迫你送礼。",
        onEnter: () => setTimeout(() => triggerCallStorm(4, '她'), 2000),
        choices: [
            { text: "好了好了，我给你买，别打了", next: "gift_accepted", cons: {mental:-15,career:-10,social:-10}, personality: {compliance: 2} },
            { text: "你再打我真报警了", next: "offline_threat", cons: {mental:-20,career:-25,social:-15}, personality: {boundary: 3} }
        ]
    },
    // 赠礼后短暂平静，但很快进入下一轮
    gift_accepted: {
        npcMessage: "谢谢亲爱的，我就知道你对我最好啦 😘 项链我收到了，这几天我心情好多了，也不怎么给你打电话了吧？你对我好，我当然也会对你好。",
        delay: 2800,
        systemMsg: "😇 送礼后她短暂温柔，让你产生“花钱买安宁”的错觉。",
        choices: [
            { text: "那就好，以后别再闹了", next: "calm_period", cons: {mental:-5,career:-5,social:-3}, personality: {emotionalGiving: 1} },
            { text: "希望你说话算话", next: "calm_period", cons: {mental:-3,career:-3,social:-3}, personality: {boundary: 1} }
        ]
    },
    calm_period: {
        npcMessage: "这几天我公司出了大事，资金链断了，下个月发不出工资。我实在走投无路了……你能不能先借我10万周转？我一定还你，连本带利。你要是不帮我，公司就完了，我也活不下去了 😭",
        delay: 3200,
        systemMsg: "💸 看似平静后突然抛出巨大危机，利用你之前的投入逼你借款。这正是真实操控的节奏：索取→短暂满足→更大索取。",
        choices: [
            { text: "好，我尽量凑给你", next: "big_loan_accept", cons: {mental:-15,career:-20,social:-15}, personality: {compliance: 3} },
            { text: "我真的没办法再借了", next: "online_harass_intro", cons: {mental:-20,career:-15,social:-20}, personality: {boundary: 2} }
        ]
    },
    // 确立关系后的大额借款直接入口
    money_step1_granted: {
        npcMessage: "亲爱的，我公司最近周转有点紧，员工工资都发不出了。你能不能先借我10万？我们都是一家人了，你不会见死不救吧？💸",
        delay: 2600,
        systemMsg: "💸 确认关系后立即大额借款。",
        choices: [
            { text: "好，我先转给你", next: "big_loan_accept", cons: {mental:-10,career:-15,social:-10}, personality: {compliance: 3} },
            { text: "10万太多了，我帮不了", next: "online_harass_intro", cons: {mental:-20,career:-10,social:-15}, personality: {boundary: 2} }
        ]
    },
    // 线上骚扰阶段：你的拒绝引发高频来电
    online_harass_intro: {
        npcMessage: "你居然拒绝我！行，那我就每天给你打电话，打到你答应为止。我不信你受得了 ☎️😈",
        delay: 2500,
        systemMsg: "📞 拒绝后骚扰升级，你每天被数十个电话轰炸。",
        onEnter: () => setTimeout(() => triggerCallStorm(8, '她'), 1500),
        choices: [
            { text: "（不堪其扰，答应借钱求清净）", next: "loan_from_harassment", cons: {mental:-25,career:-20,social:-20}, personality: {compliance: 3} },
            { text: "（拉黑所有号码，彻底切断）", next: "after_harass_block", cons: {mental:-20,career:-25,social:-25}, personality: {boundary: 3} }
        ]
    },
    loan_from_harassment: {
        npcMessage: "早这样不就完了？10万转给我，我就少打一点电话。但你记住，以后我说什么你都得听着，别让我再费劲 😤",
        delay: 2400,
        systemMsg: "🔗 你为了停止骚扰而借钱，却陷入了更深的控制。",
        choices: [
            { text: "（转完钱，心力交瘁）", next: "big_loan_accept", cons: {mental:-30,career:-25,social:-25}, personality: {compliance: 3} }
        ]
    },
    big_loan_accept: {
        npcMessage: "钱收到了。既然你帮了我这么大忙，那这周末我来你城市见个面吧，我们好好规划一下未来 ✈️",
        delay: 2500,
        systemMsg: "🤝 借款后要求线下见面，试图全面控制你的生活。",
        choices: [
            { text: "不用见面，钱按时还就行", next: "harass_from_loan", cons: {mental:-15,career:-15,social:-15}, personality: {boundary: 1} },
            { text: "好吧，见一面", next: "harass_from_loan", cons: {mental:-20,career:-25,social:-20}, personality: {compliance: 2} }
        ]
    },
    harass_from_loan: {
        npcMessage: "你躲不掉的。钱借了，人也是我的。你敢拉黑我，我就去你单位闹。你同事领导我都联系得上 🔗",
        delay: 2500,
        systemMsg: "🔗 经济捆绑后形成永久威胁。",
        onEnter: () => setTimeout(() => triggerCallStorm(10, '她'), 1500),
        choices: [
            { text: "（继续安抚，答应保持联系）", next: "bad_ending", cons: {mental:-40,career:-40,social:-35}, personality: {compliance: 3} },
            { text: "（彻底拉黑，准备面对一切）", next: "ending_silence", cons: {mental:-30,career:-30,social:-30}, personality: {boundary: 3} }
        ]
    },
    after_harass_block: {
        npcMessage: "你敢拉黑我？？我换了八个号码给你打，还用公司邮箱发邮件。你别逼我，逼急了我明天就去你单位找你！🏢",
        delay: 2500,
        systemMsg: "🚪 拉黑引发终极升级：她决定从线上转到线下，赌上一切。",
        onEnter: () => setTimeout(() => triggerCallStorm(6, '她'), 1800),
        choices: [
            { text: "你来吧，我会通知安保和警察", next: "offline_threat", cons: {mental:-25,career:-30,social:-20}, personality: {boundary: 3} },
            { text: "（惊慌失措，求她别来）", next: "offline_threat", cons: {mental:-30,career:-35,social:-25}, personality: {compliance: 1} }
        ]
    },
    offline_threat: {
        npcMessage: "我已经到你们单位楼下了。你不出来，我就从这八楼跳下去，让所有人都看看你是怎么逼死我的。你们领导我也联系了，今天没个说法这事没完 💀",
        delay: 2800,
        systemMsg: "💣 线下胁迫：跳楼威胁 + 领导施压，这正是在你切断线上联系后才发生的极端场景。",
        onEnter: () => setTimeout(() => triggerCallStorm(10, '她'), 1000),
        choices: [
            { text: "（出去见面，试图安抚）", next: "fake_resolution", cons: {mental:-35,career:-40,social:-30}, personality: {compliance: 2} },
            { text: "（坚持不见，让警察处理）", next: "ending_silence", cons: {mental:-30,career:-35,social:-25}, personality: {boundary: 4} }
        ]
    },
    fake_resolution: {
        npcMessage: "今天当着警察的面说好了，我不闹了。但你要答应保持联系，不能拉黑。我们都需要时间 🤝",
        delay: 2500,
        systemMsg: "⚠️ 虚假和平，一旦恢复联系就是新循环。",
        choices: [
            { text: "好，保持联系", next: "relapse", cons: {mental:-40,career:-45,social:-35}, personality: {compliance: 3} },
            { text: "（表面答应，回去立刻拉黑）", next: "relapse_silent", cons: {mental:-30,career:-25,social:-25}, personality: {boundary: 2} }
        ]
    },
    relapse: {
        npcMessage: "你昨天为什么没主动找我？是不是又跟别人聊天了？这辈子你都是我的。你再躲，我就死给你看 💔",
        delay: 2300,
        systemMsg: "🔄 控制成瘾。",
        choices: [
            { text: "...（你已被彻底耗尽）", next: "bad_ending", cons: {mental:-50,career:-50,social:-40} }
        ]
    },
    relapse_silent: {
        npcMessage: "你以为拉黑就完了？我换号发，我用邮件。我会让你永远活在我的阴影里 😈",
        delay: 2300,
        systemMsg: "📨 即使沉默，骚扰仍会继续，但绝不再回应是唯一出路。",
        choices: [
            { text: "(继续保持沉默)", next: "ending_silence", cons: {mental:-25,career:-20,social:-20}, personality: {boundary: 3} }
        ]
    },
    // 直接拒绝分支
    reject_warm: {
        npcMessage: "😢 我到底哪里不好？是不是嫌我年纪大、有孩子？你不试试怎么知道不合适？",
        delay: 2000,
        systemMsg: "💔 受害者模式启动。",
        choices: [
            { text: "真的不是你的问题，是我不想谈恋爱", next: "reject_explain", cons: {mental:-10,career:-5,social:-3}, personality: {boundary: 2} },
            { text: "请不要再说了", next: "reject_hard_stop", cons: {mental:-5,career:-5,social:-5}, personality: {boundary: 3} }
        ]
    },
    reject_explain: {
        npcMessage: "不想谈恋爱？那你上相亲平台干嘛？既然你浪费了我的时间，就别怪我不客气。我会找你领导谈谈 ⚡",
        delay: 2200,
        systemMsg: "⚡ 解释被歪曲为欺骗，迅速升级威胁。",
        onEnter: () => setTimeout(() => triggerCallStorm(4, '她'), 1500),
        choices: [
            { text: "你冷静，我们可以再说说", next: "fake_resolution_short", cons: {mental:-15,career:-20,social:-15}, personality: {compliance: 1} },
            { text: "(挂断电话，拉黑)", next: "offline_threat", cons: {mental:-15,career:-20,social:-15}, personality: {boundary: 4} }
        ]
    },
    reject_hard_stop: {
        npcMessage: "好，你有种。你的资料我都存了，咱们走着瞧 😤",
        delay: 2000,
        systemMsg: "🚫 直接切断，但仍可能收到后续骚扰。坚持不回应。",
        choices: [
            { text: "(不再回复，通知身边人警惕)", next: "ending_silence", cons: {mental:-12,career:-15,social:-10}, personality: {boundary: 5} }
        ]
    },
    fake_resolution_short: {
        npcMessage: "你愿意谈了？我就知道。那今天的事就不计较了，但你要补我一个礼物道歉。我明天再找你 🎀",
        delay: 2000,
        systemMsg: "🤝 再次卷入。",
        choices: [
            { text: "好……", next: "bad_ending", cons: {mental:-30,career:-30,social:-25}, personality: {compliance: 3} }
        ]
    },
    bad_ending: {
        npcMessage: "你现在舒服了吧，把我折磨成这样。我恨你，你毁了我。我会等着看你孤老终生 💔",
        delay: 2000,
        isEnding: true,
        endingType: 'bad'
    },
    ending_silence: {
        npcMessage: "你以为你能彻底消失吗？你总有弱点。我会一直看着你 👁️",
        delay: 2000,
        isEnding: true,
        endingType: 'silence'
    }
};

// ==================== 人格档案 ====================
function generatePersonalityProfile() {
    const { boundary, emotionalGiving, compliance } = personalityScores;
    let typeName, description, tags;
    if (boundary >= 7 && compliance <= 3) {
        typeName = '孤勇边界捍卫者';
        description = '你在操控的狂潮中始终紧握底线。沉默和拒绝是你的盔甲，哪怕孤立无援，守住边界是唯一的生路。';
        tags = ['#边界清晰', '#宁折不弯', '#风险承担者'];
    } else if (compliance >= 8 && boundary <= 2) {
        typeName = '温柔沦陷者';
        description = '你的善良和共情被精准利用，一步步走进别人写好的剧本。你以为的爱，其实是服从性测试。警告：有些“爱”一开始就是陷阱。';
        tags = ['#过度共情', '#服从性高', '#经济受害者'];
    } else if (emotionalGiving >= 5 && boundary >= 4 && compliance >= 4) {
        typeName = '清醒的受伤者';
        description = '你试图在共情和自我保护间寻找平衡，但操控者的技巧让你不断被拉扯，时而清醒时而心软。这是大多数真实受害者的写照。';
        tags = ['#矛盾内耗', '#半推半就', '#普通受害者'];
    } else if (boundary >= 5 && compliance <= 5 && emotionalGiving <= 3) {
        typeName = '冷漠绝缘体';
        description = '你从一开始就表现出极低的情绪回应，这让操控者暴怒却无处下口。虽然显得不近人情，但面对操控，“冷漠”恰恰是最有效的防御。';
        tags = ['#情感抽离', '#高防御', '#难以操控'];
    } else if (compliance >= 5 && emotionalGiving >= 5) {
        typeName = '血包供给者';
        description = '你不断提供情绪和物质，试图用付出来换取安宁。但操控者的胃口永无止境，你越是给予，对方就越是索取。';
        tags = ['#过度付出', '#讨好型人格', '#情感血包'];
    } else {
        typeName = '复杂挣扎者';
        description = '你在每个岔路口做出了不同选择，有时坚定有时动摇。但无论如何，你亲眼看到了操控的全貌，这本身就是一种觉醒。';
        tags = ['#普通人', '#复杂人性', '#正在学习'];
    }
    return { typeName, description, tags };
}

// ==================== UI逻辑（头像严格顶部对齐） ====================
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    analysisScreen: document.getElementById('analysis-screen'),
    messageList: document.getElementById('message-list'),
    choicesList: document.getElementById('choices-list'),
    analysisContent: document.getElementById('analysis-content'),
    profileCard: document.getElementById('personality-profile'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn')
};

let hintEnabled = true;
document.getElementById('hint-toggle-checkbox').addEventListener('change', e => hintEnabled = e.target.checked);

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function addMessage(text, type = 'npc') {
    if (type === 'system') {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message system';
        msgDiv.textContent = text;
        elements.messageList.appendChild(msgDiv);
        return;
    }
    const row = document.createElement('div');
    row.className = 'message-row ' + (type === 'self' ? 'self-row' : 'npc-row');
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar ' + (type === 'self' ? 'self-avatar' : 'npc-avatar');
    avatar.textContent = type === 'self' ? '👤' : '👩';
    
    const bubble = document.createElement('div');
    bubble.className = 'message ' + type;
    bubble.textContent = text;
    
    if (type === 'self') {
        row.appendChild(bubble);
        row.appendChild(avatar);
    } else {
        row.appendChild(avatar);
        row.appendChild(bubble);
    }
    
    elements.messageList.appendChild(row);
    elements.messageList.scrollTop = elements.messageList.scrollHeight;
}

function addChoices(choices) {
    elements.choicesList.innerHTML = '';
    if(!choices || choices.length === 0) return;
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
            addMessage(choice.text, 'self');
            if(choice.personality) {
                for(let [key, val] of Object.entries(choice.personality)) {
                    addPersonalityScore(key, val);
                }
            }
            applyConsequence(choice.cons);
            checkThresholds();
            const node = storyNodes[choice.next];
            if(node) {
                setTimeout(() => {
                    if(node.systemMsg && hintEnabled) addMessage(node.systemMsg, 'system');
                    if(node.onEnter) node.onEnter();
                    setTimeout(() => {
                        addMessage(node.npcMessage, 'npc');
                        if(node.isEnding) {
                            setTimeout(() => showAnalysis(node), 1500);
                        } else {
                            addChoices(node.choices);
                        }
                    }, node.delay || 1500);
                }, 600);
            }
        };
        elements.choicesList.appendChild(btn);
    });
}

function showAnalysis(node) {
    elements.analysisContent.innerHTML = '';
    elements.profileCard.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = node.endingType === 'bad' ? '【恶性循环结局】' : '【觉知之路结局】';
    elements.analysisContent.appendChild(title);

    const analysisItems = node.endingType === 'bad' ? [
        { label:"操控循环", quote:"“你再拉黑我一次我就不活了”", explanation:"任何回应都会被对方当成燃料。" },
        { label:"经济裹挟", quote:"“钱是你主动借给我的”", explanation:"重构叙事，债务变羁绊。" },
        { label:"煤气灯效应", quote:"“是你告诉我要挑战世俗的”", explanation:"截取片段话语让你自我怀疑。" }
    ] : [
        { label:"沉默的力量", quote:"沉默是唯一不会被利用的回应", explanation:"不回应就是最强边界。" },
        { label:"情绪归因分离", quote:"“我睡不着，全是你的错”", explanation:"她的情绪是她的课题。" },
        { label:"旁观者压力", quote:"“你出去安抚一下她”", explanation:"你的安全比面子重要。" }
    ];

    analysisItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'analysis-item';
        div.innerHTML = `<div class="analysis-label">${item.label}</div>
                         <div class="analysis-quote">${item.quote}</div>
                         <div class="analysis-explain">${item.explain}</div>`;
        elements.analysisContent.appendChild(div);
    });

    if(gameState.career < 30) {
        const note = document.createElement('p'); note.style.color = '#e94560'; note.style.margin = '10px 0';
        note.textContent = '⚠️ 你已付出沉重的事业代价——被闹到单位、领导施压。';
        elements.analysisContent.appendChild(note);
    }
    if(gameState.social < 30) {
        const note = document.createElement('p'); note.style.color = '#e94560';
        note.textContent = '⚠️ 朋友也被卷入骚扰，最终远离。';
        elements.analysisContent.appendChild(note);
    }
    if(gameState.mental < 20) {
        const note = document.createElement('p'); note.style.color = '#e94560';
        note.textContent = '⚠️ 心理防线濒临崩溃。';
        elements.analysisContent.appendChild(note);
    }

    const profile = generatePersonalityProfile();
    const profileDiv = document.createElement('div');
    profileDiv.className = 'profile-card';
    profileDiv.innerHTML = `
        <h3>🛡️ 你的情感操控人格档案</h3>
        <div class="profile-type">${profile.typeName}</div>
        <div class="profile-desc">${profile.description}</div>
        <div class="profile-tags">${profile.tags.map(t => `<span class="profile-tag">${t}</span>`).join('')}</div>
        <div class="profile-note">*基于你在本模拟中的选择生成，反映你面对操控时的行为倾向。</div>
    `;
    elements.analysisContent.appendChild(profileDiv);

    showScreen(elements.analysisScreen);
}

function resetGame() {
    gameState.mental = 100; gameState.career = 100; gameState.social = 100;
    Object.keys(thresholdsTriggered).forEach(k => thresholdsTriggered[k] = false);
    Object.keys(personalityScores).forEach(k => personalityScores[k] = 0);
    elements.messageList.innerHTML = '';
    elements.choicesList.innerHTML = '';
    updateStatusUI();
    document.getElementById('message-container').classList.remove('shaking');
}

function startGame() {
    resetGame();
    showScreen(elements.gameScreen);
    const intro = storyNodes.intro;
    addMessage(intro.npcMessage, 'npc');
    if(intro.systemMsg && hintEnabled) addMessage(intro.systemMsg, 'system');
    setTimeout(() => addChoices(intro.choices), 800);
}

elements.startBtn.addEventListener('click', startGame);
elements.restartBtn.addEventListener('click', startGame);

updateStatusUI();
showScreen(elements.startScreen);