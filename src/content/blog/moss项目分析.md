---
title: "Moss 项目分析：为什么存在、解决什么问题，以及 AI Agent 为什么需要它"
description: "深入分析 Moss 如何通过协议适配器、结构化 Plan 与交易模拟，为 AI Agent 提供安全、可验证的 Monad 链上交互能力。"
tags: ['web3', 'AI Agent', 'MCP', 'Monad']
language: 'Chinese'
draft: false
publishDate: '2026-07-14T00:00:00+08:00'
---

> 项目仓库：<https://github.com/nishuzumi/moss>  
> 分析范围：项目 README、Getting Started、MCP Tools Reference、Agent Skill Guide、Security 文档  
> 分析日期：2026-07-14

## 一、结论摘要

Moss 是一个面向 Monad 链上交互的 **Agent 交易能力框架与安全验证层**。

它并不是让大模型直接读取 ABI、拼接 calldata、保管私钥并发送交易，而是把不同 DApp 和协议的复杂操作封装成统一的 Agent 可调用能力：

```text
discover → load → action → simulate
```

Agent 负责理解用户意图、选择能力并检查结果是否符合用户要求；Moss 负责生成结构正确的未签名交易、声明交易预期效果，并通过链上状态模拟验证实际效果。

其核心价值可以概括为：

1. **把协议级复杂性从 Agent 推理中移出。**
2. **把自然语言意图转换为结构化、可验证的交易计划。**
3. **在签名前识别未声明的资产流出、超额授权、最低收入不满足和交易篡改等风险。**
4. **保持私钥和最终签名权始终位于用户钱包。**
5. **为多步骤 Agent 交易提供统一、可组合的执行基础。**

Moss 试图解决的并不只是“如何让 Agent 调用智能合约”，而是更关键的问题：

> **如何让 AI Agent 以可控、可审计、可验证的方式调用智能合约。**

---

## 二、Moss 为什么存在

### 2.1 链上操作对于 AI Agent 并不简单

从用户角度看，一次兑换可能只是：

> 将 1 MON 兑换为 USDC。

但对实际执行程序来说，可能涉及：

- 确认正确的协议和 Router 地址；
- 选择 exact-in 或 exact-out 方法；
- 处理原生代币与包装代币；
- 查询 Token decimals；
- 将人类可读金额转换为最小单位；
- 计算滑点与最低接收量；
- 判断是否需要授权；
- 设置正确的授权对象和授权额度；
- 处理退款、sweep、wrap、unwrap 等附加调用；
- 根据协议当前状态生成正确 calldata；
- 检查交易执行后真正发生的资产变化。

这些工作具有很强的协议特异性。即使 Agent 能读取 ABI，也不代表它能可靠理解完整的业务约束。

Moss README 明确指出：由 Agent 自行组装交易时，“几乎正确”的交易恰恰是最危险的，因为它可能能够成功执行，却产生非预期的资产变化。

### 2.2 LLM 擅长理解意图，但不适合承担底层交易正确性

大语言模型适合：

- 理解自然语言；
- 判断用户希望 swap、stake、claim 还是 transfer；
- 在多个候选协议之间进行选择；
- 规划多步骤任务；
- 向用户解释结果。

但它不天然适合：

- 精确进行 token decimals 运算；
- 长期记忆不断变化的协议地址；
- 稳定生成复杂 ABI calldata；
- 正确处理协议边界条件；
- 识别隐藏在内部调用中的原生代币流动；
- 判断某个授权是否超出了用户意图；
- 保证不同轮次中始终遵守同一安全规则。

因此，Moss 的设计思想是：

> 让模型负责“语义和决策”，让确定性软件负责“交易构建和机械验证”。

### 2.3 通用 MCP 工具并不足以安全完成链上写操作

普通 MCP 工具通常提供“调用某个函数”的能力，但链上操作需要比工具调用更严格的安全模型。

如果只给 Agent 一个通用合约调用工具，它仍然需要自行决定：

- 调哪个合约；
- 调哪个函数；
- 参数如何编码；
- 交易执行后应该发生什么；
- 哪些额外资产变化属于异常；
- 交易是否应当停止。

Moss 不只是暴露工具，而是增加了一层协议适配器、结构化 Plan、预期效果声明和模拟对账机制。

因此，它更接近：

- 链上 Agent 的 capability runtime；
- 交易编译器；
- 签名前策略与验证防火墙；
- 协议适配器标准。

---

## 三、Moss 解决的核心问题

### 3.1 统一不同协议的调用接口

不同协议可能使用完全不同的函数名和参数结构。Moss 使用面向用户语义的统一动词，例如：

- `swap`
- `wrap`
- `unwrap`
- `supply`
- `withdraw`
- `borrow`
- `repay`
- `stake`
- `unstake`
- `claim`
- `mint`
- `transfer`

例如，WMON 合约中的 `deposit()` 在 Moss 中被表示为 `wrap`，因为 Agent 应依据用户语义寻找能力，而不应依据协议内部函数名进行推断。

这种抽象使 Agent 可以先表达“我要做什么”，再由 Moss 确定“协议层面如何做”。

---

### 3.2 避免 Agent 手工构造 calldata

Moss 的协议适配器负责：

- 保存经过验证的合约地址；
- 使用正确 ABI；
- 处理 token decimals；
- 插入必要的 approve、wrap、unwrap 或 cleanup 步骤；
- 根据实时协议状态生成交易；
- 添加滑点等链上保护；
- 输出可交给钱包的未签名交易。

Agent 只需要传入人类可读参数，例如：

```json
{
  "tokenIn": "MON",
  "tokenOut": "USDC",
  "amount": "1"
}
```

而不是传入经过缩放的整数、ABI 编码参数或底层 Router 方法。

---

### 3.3 将用户意图表示为可验证的 Plan

Moss 的 `action` 不直接执行交易，而是生成一个 Plan。

Plan 中包含：

- `txs`：完整编码的未签名交易；
- `intent`：该计划声称要完成的操作；
- `declaredRisk`：涉及资金流出、授权、价格冲击等风险；
- `expects.out`：最多允许流出的资产；
- `expects.in`：至少应收到的资产；
- `expects.approvals`：允许授予的 Token、spender 和最大额度；
- `confirms`：模拟后必须出现的协议级回执；
- `planHash`：对核心计划内容生成的完整性哈希。

这使交易不再只是一个不透明的 calldata，而成为：

> **交易内容 + 预期结果 + 风险声明 + 完整性证明。**

---

### 3.4 在签名前验证真实资产效果

Moss 使用 `debug_traceCall` 对未签名交易进行模拟，并提取实际效果，包括：

- ERC-20 转入与转出；
- ERC-721 转移；
- Token 授权；
- NFT operator 授权；
- 原生 MON 的内部调用流动；
- WMON mint/burn；
- 实际接收方；
- 协议事件和业务回执。

然后将这些实际效果与 Plan 的 `expects` 对比。

可能产生的警告包括：

- `REVERTED`
- `PLAN_TAMPERED`
- `UNDECLARED_OUTFLOW`
- `OUTFLOW_EXCEEDS_MAX`
- `UNDECLARED_APPROVAL`
- `APPROVAL_EXCEEDS_MAX`
- `MIN_INFLOW_NOT_MET`
- `UNDECLARED_NFT_OUT`
- `NFT_OPERATOR_GRANTED`
- `CONFIRMATION_MISSING`

Moss 的规则非常明确：

> **任何 warning 都必须停止，不得将交易交给签名器。**

---

### 3.5 将“机械安全”与“意图一致性”分开

这是 Moss 最重要的设计之一。

#### Moss 负责机械验证

Moss 可以判断：

- 实际转出了什么；
- 转出金额是否超出上限；
- 实际收到了什么；
- 收入是否低于最低值；
- 是否出现未声明授权；
- Plan 是否被修改；
- 交易是否回滚。

#### Agent 负责意图一致性

Moss 看不到用户最初的自然语言，因此它不能判断：

- 用户要求 swap，但 Agent 是否错误选择了 supply；
- 用户是否真的同意支付该资产；
- 收到的资产是否就是用户想要的资产；
- spender 是否符合用户理解；
- 整体结果是否符合用户的目标。

因此，一个 warning-free Plan 只说明：

> 交易符合适配器自己声明的预期。

它并不自动说明：

> 交易符合用户的原始意图。

最终需要 Agent 将模拟得到的 `effects` 与用户要求再次对齐。

---

### 3.6 支持多步骤链上任务的连续模拟

Moss 的 `simulate(plans[])` 可以按顺序模拟多个 Plan，并在模拟过程中连续传递状态。

例如：

```text
claim → swap → supply
```

第二个 Plan 可以使用第一个 Plan 在模拟中产生的资产，第三个 Plan 又可以使用第二个 Plan 的结果。

这为 Agent 提供了一种不依赖真实执行即可验证复杂工作流的方法。

需要注意的是，Moss 当前支持的是：

- 多笔交易之间的组合；
- 按顺序连续模拟。

它暂不支持：

- 单笔交易内的闪电贷式原子组合；
- 无法验证目标链结果的跨链桥接；
- Permit/EIP-2612 等 typed-data 签名步骤。

---

## 四、Moss 的工作流程

### 4.1 Discover：发现能力

Agent 根据用户语义搜索可用能力：

```text
discover(verb?, category?, protocol?)
```

返回的信息包括：

- 协议；
- 方法；
- 能力或查询类型；
- 用户语义动词；
- 协议类别；
- 标签；
- 摘要。

这一阶段解决的是：

> 哪个协议能力能够完成用户任务？

---

### 4.2 Load：加载调用契约

```text
load([{ protocol, method }])
```

Load 会返回：

- intent 模板；
- 参数说明；
- 参数语义；
- 风险标签。

参数说明专门面向 Agent 编写。例如金额统一使用 `"1.5"` 这样的十进制字符串，而不是预先换算成链上最小单位。

Token 优先使用经过策展的符号目录，避免直接相信链上可伪造的 `symbol()`。

---

### 4.3 Action：构建 Plan

```text
action(protocol, method, account, params)
```

读操作直接返回查询结果；写操作返回 Plan。

Moss 不签名、不发送，只构建交易。

---

### 4.4 Simulate：模拟与对账

```text
simulate(plans[])
```

模拟后返回：

- `effects`
- `warnings`
- `observations`
- `gasPerTx`
- `planHashValid`

其中：

- `effects` 是机械验证和意图对齐的主要依据；
- `warnings` 决定是否必须停止；
- `observations` 是协议适配器生成的可读业务回执；
- `observations` 只能辅助解释，不能覆盖 warning。

---

### 4.5 Wallet：用户进行最终签名

只有以下条件都满足时，交易才应进入钱包：

1. 每一个 Plan 都完成模拟；
2. 模拟没有任何 warning；
3. Agent 已将实际 effects 与用户意图进行比较；
4. Agent 已向用户说明支付、接收、授权、Gas 和不确定性；
5. 用户在钱包中进行最终复核。

Moss 自身不接触私钥，也不会发送交易。

---

## 五、AI Agent 为什么需要这样的框架

### 5.1 Agent 需要能力层，而不是无限制的底层接口

让 Agent 直接调用任意合约类似于让自然语言模型直接生成机器码。

理论上可行，但难以保证：

- 正确性；
- 可维护性；
- 安全性；
- 一致性；
- 审计能力。

Moss 将协议操作封装成受约束的 capability，使 Agent 的行动空间从“任意 calldata”缩小为“经过维护和验证的业务动作”。

这与操作系统权限、类型系统和 API 网关的作用相似：不是单纯增加功能，而是限制错误表达的空间。

### 5.2 Agent 的概率性需要确定性安全层补足

LLM 的输出具有概率性。即使提示词明确，它也可能：

- 误选工具；
- 遗漏参数；
- 混淆单位；
- 忘记授权风险；
- 错误复用旧地址；
- 在多步操作中失去状态一致性。

资产操作不能只依赖“模型大概率会做对”。

Moss 通过确定性组件补足：

- 参数解析；
- 交易构建；
- Plan 哈希；
- trace 模拟；
- 实际效果提取；
- 预期效果对账；
- 强制停止规则。

因此，Moss 代表一种更合理的 Agent 工程范式：

```text
概率性规划 + 确定性执行约束 + 可验证结果
```

### 5.3 Agent 需要机器可读的风险契约

传统钱包通常只能向用户显示：

- 调用了哪个合约；
- calldata；
- 估计 Gas；
- 有时显示简单模拟结果。

但 Agent 需要更结构化的信息，例如：

- 最多支付多少；
- 至少收到多少；
- 授权给谁；
- 授权上限多少；
- 是否有未声明资产流动；
- 多个步骤合起来是否一致。

Moss 的 `expects` 相当于 Agent 交易的风险契约。

### 5.4 Agent 需要可组合但不失控的多步骤执行

未来 Agent 不会只执行单一 swap，而会执行完整策略：

```text
领取奖励 → 兑换资产 → 补充抵押物 → 偿还债务 → 重新配置仓位
```

如果每一步都由模型临时拼接，错误会随步骤数快速累积。

Moss 的多 Plan 连续模拟使 Agent 能够先验证整个过程，再将每个计划分别交给用户处理。

### 5.5 Agent 需要保持“非托管”

真正面向普通用户的链上 Agent 不应要求用户把私钥交给模型、MCP 服务或云端 Agent。

Moss 明确划分：

- Moss：构建与验证；
- Agent：理解、规划、解释；
- Wallet：保管密钥和签名；
- User：保留最终决定权。

这种边界有助于构建非托管 Agent 产品。

### 5.6 Agent 需要可扩展的协议知识分发机制

链上协议数量庞大，无法要求每个 Agent 自己学习和维护所有协议。

Moss 使用“一协议一包”的适配器模型，使协议团队或社区可以贡献：

- 正确 ABI；
- 已验证地址；
- capability；
- 风险声明；
- 业务回执；
- 测试。

这相当于建立一个 Agent 可用的链上能力生态。

---

## 六、Moss 的架构价值

Moss 的分层结构包括：

| 层级 | 组件 | 作用 |
|---|---|---|
| Machinery | `@themoss/core` | Registry、Plan、decorators 等纯框架能力 |
| Verification | `@themoss/simulator` | trace 模拟、effects 提取和 expects 对账 |
| Interfaces | `@themoss/erc` | ERC-20、ERC-721 等通用标准接口 |
| Instances | `@themoss/system` | Monad 网络配置、Token 目录、WMON |
| Protocols | `@themoss/protocol-*` | 每个具体协议的适配器 |
| Product | `@themoss/mcp-server` | 向 Agent 暴露四个 MCP 工具 |

这种分层有三个主要优点：

1. 核心框架不绑定具体协议和链上地址；
2. 每个协议可以独立开发、测试和更新；
3. MCP 产品层只暴露经过组装的明确能力目录。

---

## 七、Moss 当前的边界与局限

Moss 目前仍处于 Alpha 阶段，尚未审计，接口和 Plan 格式可能变化。

### 7.1 模拟不是最终执行保证

模拟基于某个时刻的链上状态。模拟完成到用户签名之间，可能发生：

- 价格变化；
- 流动性变化；
- Orderbook 变化；
- 合约状态变化；
- 抢跑或交易排序变化。

因此，模拟是安全网和执行预览，而不是结果承诺。最终仍需依赖交易中的 `minAmountOut` 等链上约束。

### 7.2 RPC 依赖较强

Moss 需要 RPC 支持：

- `debug_traceCall`
- `callTracer`
- `prestateTracer`
- state overrides

部分公共 RPC 不开放这些能力。

### 7.3 协议适配器本身是信任与维护边界

如果适配器：

- 使用错误地址；
- 错误描述意图；
- 错误声明 expects；
- 未及时适配协议升级；

则可能影响构建结果。

模拟对账可以发现许多未声明效果，但不能证明适配器的业务选择符合用户需求。因此适配器仍需要：

- 代码审核；
- 来源明确的 ABI；
- 链上端到端测试；
- 版本管理；
- 协议升级监控。

### 7.4 暂不适合所有链上操作

当前刻意不支持：

- 跨链桥；
- typed-data 签名流程；
- flash-loan 原子组合；
- 无法通过当前链模拟验证结果的操作。

这些限制反映了 Moss 的设计原则：

> 不能可靠验证的能力，不应仅为了覆盖更多场景而草率暴露给 Agent。

---

## 八、Moss 未来可能应用的场景

### 8.1 非托管 DeFi Copilot

用户可以用自然语言表达：

- 将 10% MON 换成稳定币；
- 领取奖励后重新质押；
- 偿还部分借款，将健康因子提高到指定区间；
- 比较多个 DEX 报价并生成可签名方案。

Moss 负责生成和模拟交易，Agent 负责策略选择与解释，钱包负责签名。

这是最直接的应用方向。

---

### 8.2 自主资产管理 Agent

未来 Agent 可以根据用户预设策略持续监控：

- 抵押率；
- 借贷利率；
- 流动性收益；
- Token 权重；
- 风险敞口；
- 到期头寸。

当满足条件时，Agent 生成再平衡 Plan，但在授权模型下决定：

- 仅通知用户；
- 请求逐笔签名；
- 在限额和白名单内由智能账户自动执行。

Moss 可以充当策略模型与钱包执行之间的交易编译和验证层。

---

### 8.3 Agent-to-Agent 经济

在多 Agent 世界中，不同 Agent 可能分别负责：

- 发现机会；
- 风险评估；
- 路径规划；
- 流动性执行；
- 资金管理；
- 审计与监督。

Moss 可以提供统一行动协议，使 Agent 之间传递的不是模糊自然语言，而是：

- capability coordinate；
- 参数；
- Plan；
- expects；
- simulation effects；
- warnings。

这能够让 Agent-to-Agent 协作具有机器可验证性。

例如：

```text
研究 Agent 提出策略
→ 风控 Agent 设置资产流出和授权上限
→ 执行 Agent 生成 Plan
→ Moss 模拟并对账
→ 审计 Agent 检查意图一致性
→ 钱包或智能账户签名
```

---

### 8.4 Monad 上的 Agent World Economy

对于持续运行的 Agent 世界，Agent 可能需要：

- 支付世界进入费；
- 购买资源；
- 参与任务悬赏；
- 向其他 Agent 购买情报或服务；
- 建立联盟资金池；
- 领取奖励；
- 在 DEX 兑换世界内收入；
- 质押或投资世界资产。

若 Agent 直接生成链上交易，世界越复杂，资金风险越高。

Moss 可作为世界经济的安全动作层：

```text
世界意图
→ Moss capability
→ Plan
→ 模拟
→ 世界规则与用户策略检查
→ 签名或账户策略执行
```

还可以在 Moss 上扩展世界专属 capability，例如：

- `enterWorld`
- `acceptBounty`
- `payAgent`
- `purchaseResource`
- `createGuild`
- `fundTreasury`
- `settlePrediction`
- `claimWorldReward`

每种 capability 都声明明确的资产流动和协议回执。

---

### 8.5 链上商业 Agent

AI Agent 可以代表个人或组织完成：

- 采购数字服务；
- 按成果支付；
- 托管释放；
- 订阅结算；
- API/x402 微支付；
- 赏金发放；
- 收款后自动分账；
- DAO 预算执行。

Moss 的价值在于，将“Agent 可以付款”升级为：

> Agent 只能通过经过声明、模拟和验证的计划付款。

结合智能账户策略，可以进一步设置：

- 单笔额度；
- 每日额度；
- Token 白名单；
- 协议白名单；
- 收款方白名单；
- 操作类型白名单。

---

### 8.6 钱包内置的自然语言交易层

钱包可以将 Moss 集成为自然语言交易编译器：

1. 用户描述目标；
2. Agent 发现可用能力；
3. Moss 构建并模拟；
4. 钱包展示结构化 effects；
5. 用户签名。

相比直接展示 calldata，这种方式可向用户展示：

- 你将支付什么；
- 你至少收到什么；
- 你授权给谁；
- 是否存在额外资产流；
- 模拟结果和风险提示。

---

### 8.7 DAO 与组织资金管理

DAO Treasury Agent 可以生成：

- 薪酬支付；
- 供应商付款；
- 资产再平衡；
- 收益管理；
- Grant 发放；
- 多步骤财务操作。

Moss Plan 可以作为治理提案附件或机器可读执行说明，使治理参与者能够检查：

- 最大资金流出；
- 预期收入；
- 授权对象；
- 目标协议；
- 模拟后的实际效果。

---

### 8.8 链上交易审计与策略防火墙

即使不使用自然语言 Agent，Moss 的 Plan 和模拟机制也可以单独用于：

- dApp 交易预执行；
- 钱包交易防火墙；
- 企业资金安全策略；
- 智能账户 policy engine；
- 自动化 Bot 风控；
- 交易审批工作流。

换言之，Moss 的长期价值可能不仅是 Agent 框架，也可能成为通用的链上“意图—交易—验证”基础设施。

---

### 8.9 协议能力市场与适配器生态

协议方未来可以发布官方 Moss Adapter，使其协议能够被各种 Agent 安全调用。

适配器可能形成类似“Agent App Store”的能力市场：

- 协议能力描述；
- 版本；
- 审计状态；
- 支持网络；
- 风险标签；
- 测试覆盖；
- 可验证构建；
- 使用量和信誉。

这可以降低新协议进入 Agent 生态的成本。

---

### 8.10 Agent 交易基准与安全评测

Moss 的结构化流程适合构建 Agent Benchmark：

- 是否正确识别用户动词；
- 是否选择正确 capability；
- 是否正确填写参数；
- 是否强制模拟；
- 遇到 warning 是否停止；
- 是否正确完成 intent alignment；
- 是否准确向用户解释资产效果。

这可以用于评测不同模型在链上任务中的：

- 正确性；
- 安全遵循；
- 多步骤规划；
- 风险识别；
- 工具使用能力。

---

## 九、对 Moss 的判断

### 9.1 Moss 真正创新的地方

单独来看，以下能力并非全新：

- ABI 封装；
- MCP 工具；
- 交易模拟；
- 钱包签名；
- 协议 SDK。

Moss 的创新点在于把这些能力组合成一条面向 Agent 的安全链路：

```text
自然语言意图
→ 语义化 capability
→ 结构化 Plan
→ 量化 expects
→ trace 模拟
→ effects reconciliation
→ Agent intent alignment
→ 用户钱包签名
```

特别是以下设计具有较强价值：

1. **以用户语义而不是合约函数名组织能力；**
2. **Plan 同时携带交易和量化预期；**
3. **将实际执行效果与声明效果机械对账；**
4. **将机械验证和用户意图验证明确分工；**
5. **坚持不签名、不发送、不托管密钥；**
6. **任何 warning 必须停止，而不是让模型自行解释或忽略。**

### 9.2 Moss 的本质

可以将 Moss 理解为以下几种角色的结合：

- Agent 的链上 capability framework；
- 自然语言意图到交易的编译器；
- 协议适配器标准；
- 交易效果类型系统；
- 签名前验证防火墙；
- 非托管 Agent 执行中间层。

### 9.3 Moss 是否是 AI Agent 必需的框架

不一定每个 Agent 都必须使用 Moss，但任何要自主处理真实链上资产的 Agent，都需要解决 Moss 所处理的同类问题：

- 工具标准化；
- 协议知识封装；
- 精确交易构建；
- 资产效果声明；
- 签名前模拟；
- 异常效果检测；
- 用户意图对齐；
- 私钥隔离；
- 多步骤组合；
- 可审计性。

因此，即使未来行业采用的不是 Moss 本身，也很可能采用类似的架构原则。

---

## 十、对未来发展的建议

若 Moss 希望从实验框架发展为通用 Agent 基础设施，建议重点扩展以下方向。

### 10.1 建立可信适配器供应链

增加：

- Adapter 签名与发布者身份；
- 版本锁定；
- ABI 和地址来源证明；
- 自动化主网回归测试；
- 协议升级监测；
- 审计状态；
- 可复现构建；
- Adapter 信誉与使用数据。

### 10.2 与智能账户权限系统集成

Moss 当前把最终签名交给钱包。未来可以与智能账户策略结合：

- Session Key；
- Spend Limit；
- Allowlist；
- Time Window；
- 操作类型限制；
- 多签审批；
- 风险等级对应不同审批方式。

这样 Agent 可以在明确边界内实现有限自主执行。

### 10.3 扩展 Intent Policy 层

目前 intent alignment 主要由 Agent 完成。未来可以增加独立策略引擎：

```yaml
max_single_outflow: 100 USDC
allowed_protocols:
  - kuru
allowed_verbs:
  - swap
  - claim
forbid_unlimited_approval: true
require_human_confirmation_above: 20 USDC
```

这可以减少安全性对提示词遵循的依赖。

### 10.4 建立跨模型、跨 Agent 的 Plan 标准

如果 Plan 格式发展为开放标准，就可以实现：

- 一个 Agent 生成；
- 另一个 Agent 审计；
- 钱包展示；
- 策略引擎批准；
- 模拟器验证；
- 智能账户执行。

这比绑定单一模型或单一 MCP Client 更有长期价值。

### 10.5 增强长期 Agent 所需的执行生命周期

未来需要处理：

- Plan 过期时间；
- 状态变化后的自动重建；
- 模拟与签名之间的 freshness；
- nonce 管理；
- 部分执行；
- 多交易失败恢复；
- 交易确认；
- 最终执行效果与模拟结果对比；
- Agent 记忆中的仓位更新。

当前 Moss 重点处理签名前阶段，未来可以扩展到完整交易生命周期，但仍应保持签名边界清晰。

---

## 十一、最终评价

Moss 的存在是因为：

> 让 AI 理解“用户想做什么”相对容易，让 AI 安全、准确、可验证地完成链上资产操作则困难得多。

Moss 没有尝试通过更复杂的提示词让 Agent 永远正确，而是承认模型具有概率性，并通过协议适配器、结构化 Plan、量化预期、链上模拟和强制停止规则建立确定性约束。

它解决的是 AI Agent 进入真实链上经济前必须解决的一类基础问题：

- **Agent 如何发现可用动作；**
- **如何正确生成交易；**
- **如何证明交易不会产生未声明效果；**
- **如何保证行为符合用户意图；**
- **如何在不托管密钥的情况下完成链上执行。**

因此，Moss 最值得关注的地方不是当前只支持几个 Monad 协议，而是它提出了一种可推广的 Agent 链上执行架构：

```text
Agent 负责意图，Adapter 负责协议知识，
Simulator 负责事实验证，Wallet 负责最终授权。
```

---

## 参考资料

1. Moss README  
   <https://github.com/nishuzumi/moss/blob/main/README.md>
2. Getting Started  
   <https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md>
3. MCP Tools Reference  
   <https://github.com/nishuzumi/moss/blob/main/docs/mcp-tools.md>
4. Agent Skill Guide  
   <https://github.com/nishuzumi/moss/blob/main/docs/agent-skill.md>
5. Security  
   <https://github.com/nishuzumi/moss/blob/main/SECURITY.md>
6. Architecture Decision Records  
   <https://github.com/nishuzumi/moss/tree/main/docs/adr>
