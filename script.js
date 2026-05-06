// ==================== 振动与来电 ====================
function vibrateDevice(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch(e){} }
}

let activeCallTimer = null;
let stopCallFlag = false;

function stopAllCalls() {
    stopCallFlag = true;
    if (activeCallTimer) {
        clearTimeout(activeCallTimer);
        activeCallTimer = null;
    }
    vibrateDevice(0);
    const overlay = document.getElementById('incoming-call-overlay');
    if (overlay) overlay.classList.add('hidden');
}

// 加速版电话风暴：通话 1.5s，间隔 0.5s
function triggerCallStorm(count = 5, callerName = '赵婉如') {
    stopCallFlag = false;
    let currentCall = 0;
    const overlay = document.getElementById('incoming-call-overlay');
    const counterEl = document.getElementById('call-counter');
    const callNameEl = document.getElementById('call-caller-name');
    const rejectBtn = document.getElementById('call-reject-btn');
    
    callNameEl.textContent = callerName;
    overlay.classList.remove('hidden');
    vibrateDevice([1000, 300, 1000, 300]);
    
    function nextCall() {
        if (stopCallFlag) {
            overlay.classList.add('hidden');
            vibrateDevice(0);
            return;
        }
        currentCall++;
        if (currentCall > count) {
            overlay.classList.add('hidden');
            vibrateDevice(0);
            return;
        }
        counterEl.textContent = `第 ${currentCall}/${count} 次来电`;
        vibrateDevice([1000, 300, 1000, 300]);
        activeCallTimer = setTimeout(() => {
            if (stopCallFlag) return;
            if (currentCall < count) {
                // 间隔缩短至 0.5 秒
                setTimeout(nextCall, 500);
            } else {
                nextCall();
            }
        }, 1500); // 通话仅 1.5 秒
    }
    
    nextCall();
    
    rejectBtn.onclick = () => {
        // 挂断只隐藏当前弹窗，不停止后续来电
        vibrateDevice(0);
        overlay.classList.add('hidden');
        // 0.5 秒后继续下一个来电
        setTimeout(() => {
            if (!stopCallFlag && currentCall < count) {
                overlay.classList.remove('hidden');
                nextCall();
            }
        }, 500);
    };
}

// ==================== 状态 ====================
const gameState = { mental: 100, career: 100, social: 100, phase: 'online' };
const thresholdsTriggered = { career60: false, career30: false, social60: false, social30: false };
const personalityScores = { boundary: 0, emotionalGiving: 0, compliance: 0, chaos: 0 };

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
    if (gameState.phase !== 'offline') return;
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

// ==================== 剧情树（选项含 stopHarass 标志） ====================
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
        npcMessage: "我离过一次婚，有个儿子。这些年一个人带孩子、创业，真的很累。有时候想找个人说说话都找不到……你愿意听我说这些吗？",
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
            { text: "好，如果我有空的话", next: "meet_invite", cons: {mental:-5,career:-5,social:0}, personality: {compliance: 1}, stopHarass: true },
            { text: "我工作很忙，没法保证", next: "guilt_trip_time", cons: {mental:-10,career:0,social:-5}, personality: {boundary: 2} }
        ]
    },
    guilt_trip_time: {
        npcMessage: "我就知道，你们男人都一样。当初说想找个人说话的是你，现在嫌我烦的也是你。你知道我一个人带儿子有多难吗？你连半小时都不肯给我 💢",
        delay: 2500,
        systemMsg: "🔄 道德绑架。",
        choices: [
            { text: "我不是那个意思，好吧我尽量", next: "meet_invite", cons: {mental:-12,career:-8,social:-8}, personality: {compliance: 2}, stopHarass: true },
            { text: "你真的误会了，我坚持我的界限", next: "status_request_rebel", cons: {mental:-15,career:-5,social:-10}, personality: {boundary: 2} }
        ]
    },
    meet_invite: {
        npcMessage: "太好了！那这周末我们见个面吧？我想亲眼看看你，一起吃顿饭。我保证不会让你失望的 😉",
        delay: 2700,
        systemMsg: "☕ 从线上转到线下，关系实质化。",
        choices: [
            { text: "好，那就见一面", next: "first_date", cons: {mental:-5,career:-5,social:-5}, personality: {compliance: 1}, stopHarass: true },
            { text: "见面太快了，还是先聊聊吧", next: "status_request", cons: {mental:-8,career:0,social:-3}, personality: {boundary: 1} }
        ]
    },
    first_date: {
        npcMessage: "见面感觉真好，你和我想象中一模一样。我儿子肯定也会喜欢你的。我们现在算是在一起了吧？",
        delay: 2800,
        systemMsg: "💍 线下见面后迅速推动确认关系。",
        choices: [
            { text: "我觉得我们需要更多时间", next: "status_request", cons: {mental:-8,career:-5,social:-5}, personality: {boundary: 1} },
            { text: "嗯……算是吧", next: "honeymoon_phase", cons: {mental:-5,career:-10,social:-10}, personality: {compliance: 3}, stopHarass: true }
        ]
    },
    status_request: {
        npcMessage: "那我们算是在一起了吗？我不想玩暧昧。你如果对我没意思，就直接告诉我。",
        delay: 2800,
        systemMsg: "💍 名分索取。",
        choices: [
            { text: "我没有谈恋爱的打算", next: "gift_request", cons: {mental:-8,career:-5,social:-5}, personality: {boundary: 1} },
            { text: "好，那就谈谈看吧", next: "honeymoon_phase", cons: {mental:-5,career:-10,social:-10}, personality: {compliance: 3}, stopHarass: true }
        ]
    },
    status_request_rebel: {
        npcMessage: "你居然这样对我？我到底哪里不好？我为你拒绝了那么多人，你就是个没良心的。但我不会放弃的 😤",
        delay: 2500,
        systemMsg: "💢 拒绝名分后愤怒纠缠。",
        choices: [
            { text: "请你冷静，我们不合适", next: "gift_request_rebel", cons: {mental:-20,career:-10,social:-10}, personality: {boundary: 2} },
            { text: "(沉默不回复)", next: "gift_request_rebel", cons: {mental:-18,career:-5,social:-10}, personality: {boundary: 1} }
        ]
    },
    honeymoon_phase: {
        npcMessage: "亲爱的，你真好。以后你每天叫我起床好不好？还有啊，我看中了一套情侣装，我们一人一件，就当是你送我的第一个礼物 🎀",
        delay: 2600,
        systemMsg: "🍯 用甜蜜要求开始建立服从。",
        choices: [
            { text: "好，我给你买", next: "sweet_requests", cons: {mental:-5,career:-3,social:-3}, personality: {compliance: 2}, stopHarass: true },
            { text: "我们才刚在一起，别急着要礼物吧", next: "gentle_retreat", cons: {mental:-8,career:-3,social:-3}, personality: {boundary: 1} }
        ]
    },
    gentle_retreat: {
        npcMessage: "好吧，你说得对。是我太心急了……不过我真的很想让你融入我的生活。我儿子下个月生日，你陪我一起去挑个礼物好不好？不用你花钱，我就想你给我参谋参谋 👦",
        delay: 2800,
        systemMsg: "🎈 被拒后立刻退一步，用“孩子”制造温馨场景。",
        choices: [
            { text: "好啊，我很乐意", next: "son_gift_talk", cons: {mental:-5,career:-3,social:-3}, personality: {emotionalGiving: 2}, stopHarass: true },
            { text: "最近有点忙，可能去不了", next: "son_gift_talk", cons: {mental:-8,career:0,social:-5}, personality: {boundary: 1} }
        ]
    },
    son_gift_talk: {
        npcMessage: "你真的太好了。其实我一个人带孩子，有时候真的觉得无助。前夫根本不管，什么事都得我自己扛。遇到你，我觉得生活又有光了 🌟",
        delay: 3200,
        systemMsg: "😢 深度示弱。",
        choices: [
            { text: "以后我会多帮你的", next: "small_loan_intro", cons: {mental:-8,career:-5,social:-5}, personality: {emotionalGiving: 2}, stopHarass: true },
            { text: "你确实挺辛苦的，但我们也得慢慢来", next: "small_loan_intro", cons: {mental:-5,career:-3,social:-3}, personality: {boundary: 1} }
        ]
    },
    small_loan_intro: {
        npcMessage: "亲爱的……我今天遇到一点急事。要给儿子交补习班的钱，但我银行卡出了点问题，你能不能先帮我垫一下？不多，就3000块，我明天就还你。",
        delay: 3000,
        systemMsg: "💰 第一次小额借钱。",
        choices: [
            { text: "好，我先转给你", next: "small_loan_return", cons: {mental:-5,career:-3,social:-3}, personality: {compliance: 2}, stopHarass: true },
            { text: "3000块？好吧，下不为例", next: "small_loan_return", cons: {mental:-3,career:-3,social:-3}, personality: {compliance: 1}, stopHarass: true }
        ]
    },
    small_loan_return: {
        npcMessage: "钱收到了，谢谢你亲爱的！明天一定还你。你真是我的超人 💪",
        delay: 2500,
        systemMsg: "✅ 她按时还钱了。",
        choices: [
            { text: "钱收到了", next: "call_me_husband", cons: {mental:0,career:0,social:0}, personality: {} }
        ]
    },
    call_me_husband: {
        npcMessage: "老公~~~我以后就这么叫你了好不好？你也叫我老婆，我们就是最幸福的一对 👩‍❤️‍👨",
        delay: 2700,
        systemMsg: "💑 亲密称呼绑定。",
        choices: [
            { text: "呃，好吧……", next: "more_sweet_requests", cons: {mental:-5,career:-8,social:-8}, personality: {compliance: 3}, stopHarass: true },
            { text: "还是别这样吧，叫名字就好", next: "reject_husband_gentle", cons: {mental:-8,career:-5,social:-5}, personality: {boundary: 2} }
        ]
    },
    reject_husband_gentle: {
        npcMessage: "好吧，那我听你的。不过在我心里，你早就是我最重要的人了。你知道吗，我最近一直在想我们的未来，等以后我们结婚了，儿子就有爸爸了，我也可以把公司交给你打理……",
        delay: 4000,
        systemMsg: "🌈 未来畅想包裹索取。",
        choices: [
            { text: "你都想那么远了……", next: "more_sweet_requests", cons: {mental:-10,career:-5,social:-5}, personality: {emotionalGiving: 2} },
            { text: "先谈谈看吧，想那么远干嘛", next: "more_sweet_requests", cons: {mental:-12,career:-5,social:-5}, personality: {boundary: 1} }
        ]
    },
    sweet_requests: {
        npcMessage: "就知道你疼我。哦对了，我闺蜜下周生日，我想送她个包，但最近手头有点紧……你能不能先帮我垫上？不多，就几千块。",
        delay: 2500,
        systemMsg: "💳 小额垫付。",
        choices: [
            { text: "好，我给你转", next: "sweet_praise", cons: {mental:-5,career:-5,social:-3}, personality: {compliance: 3}, stopHarass: true },
            { text: "这不太合适吧", next: "sweet_guilt", cons: {mental:-12,career:-3,social:-5}, personality: {boundary: 2} }
        ]
    },
    sweet_praise: {
        npcMessage: "你真的太宠我了，我觉得自己是全世界最幸福的女人。我朋友都羡慕我，说我怎么找了这么体贴的男朋友。以后我也要对你好好的 💖",
        delay: 2800,
        systemMsg: "😍 高甜反馈。",
        choices: [
            { text: "你开心就好", next: "call_me_husband", cons: {mental:-3,career:-3,social:-3}, personality: {emotionalGiving: 2} },
            { text: "以后别老是为闺蜜花钱了", next: "call_me_husband", cons: {mental:-5,career:-3,social:-3}, personality: {boundary: 1} }
        ]
    },
    more_sweet_requests: {
        npcMessage: "亲爱的，我最近公司最近出了点问题。你能不能借我点钱周转一下？以后我公司做大了，你就是最大的受益人。",
        delay: 2700,
        systemMsg: "📈 较大开销。",
        choices: [
            { text: "好，多少钱？", next: "money_crisis", cons: {mental:-5,career:-10,social:-5}, personality: {compliance: 3}, stopHarass: true },
            { text: "我手头也没多少钱……", next: "sweet_guilt", cons: {mental:-10,career:-5,social:-5}, personality: {boundary: 2} }
        ]
    },
    sweet_guilt: {
        npcMessage: "你不爱我了是不是？我为你付出了那么多，你连这点都不肯付出？我闺蜜都说我傻，找了你这么个抠门的男人 😢",
        delay: 2500,
        systemMsg: "😢 情感绑架。",
        choices: [
            { text: "好好好，我给你还不行吗", next: "money_crisis", cons: {mental:-15,career:-10,social:-8}, personality: {compliance: 3}, stopHarass: true },
            { text: "随便你怎么说，我不会给的", next: "online_harass_intro", cons: {mental:-20,career:-5,social:-10}, personality: {boundary: 3} }
        ]
    },
    money_crisis: {
        npcMessage: "亲爱的……是这样的，我资金链彻底断了，能不能先借我10万块周转？我们是一体的，你不会看着我死吧？😭",
        delay: 3500,
        systemMsg: "💸 核心借款。",
        choices: [
            { text: "好，我尽量凑给你", next: "loan_accepted", cons: {mental:-15,career:-20,social:-15}, personality: {compliance: 3}, stopHarass: true },
            { text: "这金额太大了，我真的没办法", next: "loan_refused", cons: {mental:-25,career:-15,social:-20}, personality: {boundary: 2} }
        ]
    },
    loan_accepted: {
        npcMessage: "我就知道没看错人！周末来看看我儿子吧，他总问起你。",
        delay: 2500,
        systemMsg: "🤝 借款后绑定。",
        choices: [
            { text: "好，我也挺喜欢孩子的", next: "married_life", cons: {mental:-10,career:-10,social:-15}, personality: {compliance: 2}, stopHarass: true },
            { text: "我还没准备好见孩子", next: "post_loan_pushback", cons: {mental:-15,career:-15,social:-15}, personality: {boundary: 1} }
        ]
    },
    loan_refused: {
        npcMessage: "你不借？？行，你等着，我会让你后悔的。",
        delay: 2300,
        systemMsg: "🚨 反弹。",
        onEnter: () => setTimeout(() => triggerCallStorm(10, '赵婉如'), 1500),
        choices: [
            { text: "（不堪其扰，答应借钱）", next: "loan_from_harassment", cons: {mental:-25,career:-20,social:-20}, personality: {compliance: 2}, stopHarass: true },
            { text: "（拉黑所有联系方式）", next: "block_lead_to_offline", cons: {mental:-20,career:-25,social:-25}, personality: {boundary: 3} }
        ]
    },
    post_loan_pushback: {
        npcMessage: "我们都相处这么久了，你跟我说没准备好？太让我寒心了！",
        delay: 2500,
        systemMsg: "🔄 指责。",
        choices: [
            { text: "好了好了，都听你的", next: "married_life", cons: {mental:-20,career:-15,social:-20}, personality: {compliance: 3}, stopHarass: true },
            { text: "我真的受够了，我们分开吧", next: "block_lead_to_offline", cons: {mental:-30,career:-20,social:-25}, personality: {boundary: 2} }
        ]
    },
    married_life: {
        npcMessage: "亲爱的，我怀孕了。我们结婚吧。",
        delay: 2800,
        systemMsg: "🤰 怀孕逼婚。",
        choices: [
            { text: "好，我们结婚，我会负责", next: "married_aftermath", cons: {mental:-40,career:-30,social:-30}, personality: {compliance: 4}, stopHarass: true },
            { text: "怀孕了？也没睡过啊，谁的？", next: "married_aftermath", cons: {mental:-35,career:-35,social:-30}, personality: {chaos: 2} }
        ]
    },
    married_aftermath: {
        npcMessage: "结婚了就得像个家。工资卡交给我管，你辞职来我公司帮忙。",
        delay: 2800,
        systemMsg: "🏠 上交收入。",
        choices: [
            { text: "行，都听你的", next: "married_deeper", cons: {mental:-15,career:-50,social:-10}, personality: {compliance: 3}, stopHarass: true },
            { text: "我不能放弃工作", next: "married_deeper", cons: {mental:-20,career:-20,social:-10}, personality: {boundary: 1} }
        ]
    },
    married_deeper: {
        npcMessage: "还有，我前夫每个月都要来看孩子，有时会住几天。你别介意。以后家里的事我说了算。",
        delay: 2700,
        systemMsg: "💔 前夫介入。",
        choices: [
            { text: "……（沉默接受）", next: "ending_marriage", cons: {mental:-30,career:-10,social:-20}, personality: {compliance: 3}, stopHarass: true }
        ]
    },
    online_harass_intro: {
        npcMessage: "你不肯付出是吧？那我就让你看看什么叫坚持。从今天起，我每天给你打电话，直到你懂事儿为止 📞",
        delay: 2500,
        systemMsg: "📞 骚扰开始。",
        onEnter: () => setTimeout(() => triggerCallStorm(12, '赵婉如'), 1500),
        choices: [
            { text: "（接电话，试着再次安抚）", next: "harassment_compromise_loop", cons: {mental:-20,career:-10,social:-10}, personality: {compliance: 2}, stopHarass: true },
            { text: "（拉黑她）", next: "block_lead_to_offline", cons: {mental:-15,career:-15,social:-15}, personality: {boundary: 3} }
        ]
    },
    harassment_compromise_loop: {
        npcMessage: "你终于接了！只要你听话，我就可以少打一点。但你必须补偿我，上次说的礼物翻倍，再加一个包包，没问题吧？",
        delay: 2500,
        systemMsg: "🔄 妥协换来得寸进尺。",
        choices: [
            { text: "好，我给你买，别打了", next: "loop_deeper", cons: {mental:-25,career:-15,social:-15}, personality: {compliance: 3}, stopHarass: true },
            { text: "这次绝对不行", next: "block_lead_to_offline", cons: {mental:-20,career:-20,social:-20}, personality: {boundary: 2} }
        ]
    },
    loop_deeper: {
        npcMessage: "这还差不多。以后每天主动给我打一个电话，不然我就加倍打给你。",
        delay: 2600,
        systemMsg: "🔗 形成条件反射。",
        onEnter: () => setTimeout(() => triggerCallStorm(25, '赵婉如'), 2000),
        choices: [
            { text: "……知道了", next: "loop_extreme", cons: {mental:-35,career:-20,social:-20}, personality: {compliance: 3}, stopHarass: true }
        ]
    },
    loop_extreme: {
        npcMessage: "你最近态度又不行了！今天我要给你打100个电话，让你长长记性。",
        delay: 2200,
        systemMsg: "📞 电话轰炸100次！",
        onEnter: () => setTimeout(() => triggerCallStorm(100, '赵婉如'), 1000),
        choices: [
            { text: "（去营业厅办理停机）", next: "stop_service_end", cons: {mental:-50,career:-30,social:-30}, personality: {chaos: 2} },
            { text: "（继续忍受）", next: "ending_endless_loop", cons: {mental:-60,career:-40,social:-40}, personality: {compliance: 4} }
        ]
    },
    loan_from_harassment: {
        npcMessage: "早这样不就完了？10万转给我，我就少打一点。",
        delay: 2400,
        systemMsg: "🔗 借钱换安宁。",
        choices: [
            { text: "（转钱，心力交瘁）", next: "married_life", cons: {mental:-30,career:-25,social:-25}, personality: {compliance: 3}, stopHarass: true }
        ]
    },
    block_lead_to_offline: {
        npcMessage: "你敢拉黑我？？我明天就去你单位找你！🏢",
        delay: 2500,
        systemMsg: "🚪 线下升级。",
        onEnter: () => {
            gameState.phase = 'offline';
            checkThresholds();
            setTimeout(() => triggerCallStorm(8, '赵婉如'), 1800);
        },
        choices: [
            { text: "你来吧，我会通知安保和警察", next: "offline_threat", cons: {mental:-25,career:-30,social:-20}, personality: {boundary: 3} },
            { text: "（惊慌失措，求她别来）", next: "offline_threat", cons: {mental:-30,career:-35,social:-25}, personality: {compliance: 1} }
        ]
    },
    offline_threat: {
        npcMessage: "我已经到你们单位楼下了。你不出来，我就从这八楼跳下去，让你们领导都看看 💀",
        delay: 2800,
        systemMsg: "💣 跳楼威胁。",
        onEnter: () => setTimeout(() => triggerCallStorm(10, '赵婉如'), 1000),
        choices: [
            { text: "（出去见面，试图安抚）", next: "ending_lost_all", cons: {mental:-35,career:-50,social:-40}, personality: {chaos: 3}, stopHarass: true },
            { text: "（坚持不见，让警察处理）", next: "ending_silence", cons: {mental:-30,career:-40,social:-30}, personality: {boundary: 4} }
        ]
    },
    gift_request: {
        npcMessage: "既然我们还在互相了解，那你愿不愿意帮个小忙？我看中了一条项链，就当生日礼物。你送了我，我保证不天天打电话了 🎁",
        delay: 2700,
        systemMsg: "💰 索要礼物。",
        choices: [
            { text: "多少钱？我给你转", next: "gift_accepted_calm", cons: {mental:-5,career:-5,social:-3}, personality: {compliance: 2}, stopHarass: true },
            { text: "我觉得送礼物还太早", next: "online_harass_intro", cons: {mental:-10,career:-5,social:-5}, personality: {boundary: 2} }
        ]
    },
    gift_request_rebel: {
        npcMessage: "我不管，你必须补偿我。一条项链而已，不贵。你买了我就原谅你，不然我天天打电话 ☎️😡",
        delay: 2600,
        systemMsg: "🎁 骚扰逼买。",
        onEnter: () => setTimeout(() => triggerCallStorm(4, '赵婉如'), 2000),
        choices: [
            { text: "好了好了，我给你买", next: "gift_accepted_calm", cons: {mental:-15,career:-10,social:-10}, personality: {compliance: 2}, stopHarass: true },
            { text: "你再打我真报警了", next: "offline_threat", cons: {mental:-20,career:-25,social:-15}, personality: {boundary: 3} }
        ]
    },
    gift_accepted_calm: {
        npcMessage: "谢谢亲爱的，我就知道你对我最好啦 😘 项链我收到了，这几天心情好多了。",
        delay: 2800,
        systemMsg: "😇 花钱买安宁。",
        choices: [
            { text: "那就好，以后别再闹了", next: "small_loan_intro", cons: {mental:-5,career:-5,social:-3}, personality: {emotionalGiving: 1} },
            { text: "希望你说话算话", next: "small_loan_intro", cons: {mental:-3,career:-3,social:-3}, personality: {boundary: 1} }
        ]
    },
    reject_warm: {
        npcMessage: "😢 我到底哪里不好？是不是嫌我年纪大、有孩子？",
        delay: 2000,
        systemMsg: "💔 受害者模式。",
        choices: [
            { text: "真的不是你的问题，是我不想谈恋爱", next: "reject_explain", cons: {mental:-10,career:-5,social:-3}, personality: {boundary: 2} },
            { text: "请不要再说了", next: "reject_hard_stop", cons: {mental:-5,career:-5,social:-5}, personality: {boundary: 3} }
        ]
    },
    reject_explain: {
        npcMessage: "不想谈恋爱？那你上相亲平台干嘛？我会在平台上挂你，让大家评评理 ⚡",
        delay: 2200,
        systemMsg: "⚡ 威胁曝光。",
        choices: [
            { text: "你冷静，我们可以再说说", next: "puppet_entanglement", cons: {mental:-15,career:-20,social:-15}, personality: {chaos: 2}, stopHarass: true },
            { text: "(删除账号，注销平台)", next: "ending_disappear", cons: {mental:-15,career:-20,social:-15}, personality: {boundary: 4} }
        ]
    },
    reject_hard_stop: {
        npcMessage: "好，你有种。你的资料我都存了，咱们走着瞧 😤",
        delay: 2000,
        systemMsg: "🚫 直接切断。",
        choices: [
            { text: "(不再回复，注销账号)", next: "ending_disappear", cons: {mental:-12,career:-20,social:-15}, personality: {boundary: 5} }
        ]
    },
    puppet_entanglement: {
        npcMessage: "我就知道你放不下我。那今天的事就不计较了，但你要补偿我。我想喝杯咖啡，你帮我付款 🎀",
        delay: 2500,
        systemMsg: "🤝 回应即被节奏带走。",
        onEnter: () => setTimeout(() => triggerCallStorm(6, '赵婉如'), 1500),
        choices: [
            { text: "好，我付……", next: "harassment_compromise_loop", cons: {mental:-20,career:-10,social:-10}, personality: {compliance: 3}, stopHarass: true },
            { text: "我不买，别再逼我了", next: "block_lead_to_offline", cons: {mental:-25,career:-15,social:-15}, personality: {boundary: 2} }
        ]
    },
    stop_service_end: {
        npcMessage: "你居然停机了？好，那我直接去你单位。咱们当面聊。",
        delay: 2000,
        isEnding: true,
        endingId: 'stop_service'
    },
    ending_marriage: {
        npcMessage: "以后这个家就是我的天下。你好好赚钱，别的少管。孩子也不是你的，但你这辈子都别想甩掉我们。",
        delay: 3000,
        isEnding: true,
        endingId: 'marriage'
    },
    ending_endless_loop: {
        npcMessage: "我这辈子就缠上你了，你别想逃。你手机永远别想清净。",
        delay: 2000,
        isEnding: true,
        endingId: 'endless_loop'
    },
    ending_lost_all: {
        npcMessage: "你早这样配合不就好了？以后乖乖听话，否则下次就不止跳楼这么简单了。",
        delay: 2000,
        isEnding: true,
        endingId: 'lost_all'
    },
    ending_silence: {
        npcMessage: "你以为你能彻底消失吗？你总有弱点。我会一直看着你 👁️",
        delay: 2000,
        isEnding: true,
        endingId: 'silence'
    },
    ending_disappear: {
        npcMessage: "你删号了？哼，你这辈子都别想在圈子里好混。",
        delay: 2000,
        isEnding: true,
        endingId: 'disappear'
    },
    ending_confused_puppet: {
        npcMessage: "我就知道你放不下我。以后我说什么就是什么，别再让我费劲。",
        delay: 2000,
        isEnding: true,
        endingId: 'confused_puppet'
    }
};

// ==================== 结局人格映射 ====================
const endingProfiles = {
    marriage: {
 typeName: '永远的姐夫',
        description: '你一步步走进婚姻，上交工资、辞掉工作、前夫频繁介入，孩子也不是你的。三十如狼、四十如虎，五十则如狼似虎。',
        tags: ['#喜当爹', '#NTR', '#接盘侠']
    },
    endless_loop: {
        typeName: '忍者神龟',
        description: '如果西西弗斯是天天推石头，那姐姐就天天推你。',
        tags: ['#血包', '#午夜凶铃', '#STAY！', '#拼夕夕弗斯']
    },
    lost_all: {
        typeName: '烈迹牛马',
        description: '你在最后关头拒绝了，但代价是巨大的。她冲到你单位，跳楼、报警、找领导，你的名声毁于一旦，最终可能被迫离职，告别奋斗多年的行业。',
        tags: ['#线下真实', '#肚子里有小朋友警告', '#自爆卡车', '#清醒但惨·烈']
    },
    disappear: {
        typeName: '退！退！退！',
        description: '你从一开始就嗅到了危险，果断拒绝并注销账号。虽然被她在平台上挂了几天，但风头一过，你全身而退，避免了更大的麻烦。',
        tags: ['#润', '#删库跑路', '#呀咩咯']
    },
    confused_puppet: {
        typeName: '嫌舔永动机',
        description: '你时而坚决时而妥协，永远在对方的新威胁和她手中所谓的“把柄”之间摇摆。每一次接她的话，都让你更深地陷入纠缠，朋友被骚扰、家人被惊动，你最终钱财两失。',
        tags: ['#反复拉扯', '#人财两空', '#你已急哭']
    },
    silence: {
        typeName: '无fuck说',
        description: '你选择了彻底沉默和断开连接，承受着巨大的心理压力和外界的误解，但你终于划清了边界。虽然阴影仍在，但你重新夺回了生活的主导权（不一定）。',
        tags: ['#彻底断联', '#永久拔网线', '#割肉', '#一次外向换来终生内向']
    },
    stop_service: {
        typeName: '亡者农药',
        description: '你以吃安眠药、跳楼相威胁，最终拉黑删除、办理停机，世界暂时安静了。但你心里清楚，这只是一场暂时的撤退，对方不会善罢甘休。你即将面对的是线下的暴风雨。',
        tags: ['#停机遁走', '#临时清净', '#暴风雨前']
    }
};

let currentEndingId = '';

// ==================== UI逻辑 ====================
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
        const d = document.createElement('div'); d.className = 'message system'; d.textContent = text;
        elements.messageList.appendChild(d); return;
    }
    const row = document.createElement('div');
    row.className = 'message-row ' + (type === 'self' ? 'self-row' : 'npc-row');
    const avatar = document.createElement('div');
    avatar.className = 'avatar ' + (type === 'self' ? 'self-avatar' : 'npc-avatar');
    avatar.textContent = type === 'self' ? '👤' : '👩';
    const bubble = document.createElement('div');
    bubble.className = 'message ' + type; bubble.textContent = text;
    row.appendChild(avatar);
    row.appendChild(bubble);
    elements.messageList.appendChild(row);
    elements.messageList.scrollTop = elements.messageList.scrollHeight;
}

function addChoices(choices) {
    elements.choicesList.innerHTML = '';
    if(!choices) return;
    choices.forEach(c => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.textContent = c.text;
        btn.onclick = () => {
            // 只有标记为妥协的选项才停止电话
            if (c.stopHarass) {
                stopAllCalls();
            }
            // 即使非妥协，也可能由于剧情进入新节点触发新电话，不主动停止

            document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
            addMessage(c.text, 'self');
            if(c.personality) for(let [k,v] of Object.entries(c.personality)) addPersonalityScore(k,v);
            applyConsequence(c.cons);
            checkThresholds();
            const node = storyNodes[c.next];
            if(node) {
                setTimeout(() => {
                    if(node.systemMsg && hintEnabled) addMessage(node.systemMsg, 'system');
                    if(node.onEnter) node.onEnter();
                    setTimeout(() => {
                        addMessage(node.npcMessage, 'npc');
                        if(node.isEnding) {
                            currentEndingId = node.endingId || 'silence';
                            stopAllCalls(); // 结局时强制停止所有电话
                            setTimeout(() => showAnalysis(), 1500);
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

function showAnalysis() {
    elements.analysisContent.innerHTML = '';
    elements.profileCard.innerHTML = '';
    
    const profile = endingProfiles[currentEndingId] || endingProfiles.silence;
    const pd = document.createElement('div');
    pd.className = 'profile-card';
    pd.innerHTML = `<h3>🛡️ 你的真实结局推演</h3>
        <div class="profile-type">${profile.typeName}</div>
        <div class="profile-desc">${profile.description}</div>
        <div class="profile-tags">${profile.tags.map(t=>`<span class="profile-tag">${t}</span>`).join('')}</div>
        <div class="profile-note">*以上结局基于你在此模拟中的关键选择推演而出。</div>`;
    elements.analysisContent.appendChild(pd);

    if(gameState.career<30) {
        const n=document.createElement('p'); n.style.color='#e94560'; n.style.margin='10px 0';
        n.textContent='⚠️ 你已付出沉重的事业代价。';
        elements.analysisContent.appendChild(n);
    }
    if(gameState.social<30) {
        const n=document.createElement('p'); n.style.color='#e94560';
        n.textContent='⚠️ 朋友也被卷入骚扰，最终远离。';
        elements.analysisContent.appendChild(n);
    }
    if(gameState.mental<20) {
        const n=document.createElement('p'); n.style.color='#e94560';
        n.textContent='⚠️ 心理防线濒临崩溃。';
        elements.analysisContent.appendChild(n);
    }

    showScreen(elements.analysisScreen);
}

function resetGame() {
    gameState.mental=100; gameState.career=100; gameState.social=100; gameState.phase='online';
    Object.keys(thresholdsTriggered).forEach(k=>thresholdsTriggered[k]=false);
    Object.keys(personalityScores).forEach(k=>personalityScores[k]=0);
    elements.messageList.innerHTML=''; elements.choicesList.innerHTML=''; updateStatusUI();
    document.getElementById('message-container').classList.remove('shaking');
    stopAllCalls();
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
