# 操作手册 · 给负责店铺和服务器的伙伴

> 分工：**你（伙伴）** 负责小红书账号、店铺后台、香港服务器；**主理人** 负责内容、产品和数据。
> 每一步做完在 `[ ]` 里打勾。卡住了把截图发给主理人，主理人会转给 Claude 处理。

---

## A. 先问清楚平台规则（第 1 天，10 分钟）

用准备开店的账号，进 **小红书 App → 我 → 设置 → 帮助与客服 → 商家客服**，问下面 4 个问题，**每个回复都截图保存**：

- [ ] 1. 「我想卖『性格测试 / 人格测试』的兑换码（虚拟商品，下单后发一个码，到测试网页上输码看报告），应该选哪个类目？个人售卖可以卖吗？」
- [ ] 2. 「虚拟商品自动发货的内容里，能不能写测试网页的地址（买家付款后才看得到）？」
- [ ] 3. 「卡券类商品怎么上传兑换码库存、怎么设置自动发货？」
- [ ] 4. 「结算周期多久？提现到哪里？」

> 如果客服说「测试类不能卖」或「发货内容不能带网址」，先停，把截图发给主理人，我们再调整方案。

## B. 部署香港服务器（第 1 天，约 30 分钟）

需要：香港服务器（Ubuntu / Debian 最省事）、一个域名（比如 `xxx.com`，在 Namecheap、Cloudflare、阿里云国际站都能买）。

1. **域名解析**：在域名后台加一条 A 记录，主机记录填 `test`（或者 `@`），值填服务器公网 IP。
   - 如果用 Cloudflare 管 DNS，要选 **DNS only（灰色云朵）**，不要开代理。
2. **装 Node.js 22**（要求 22.13 及以上）：
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   node -v
   ```
   用宝塔面板的话，可以在「软件商店 → Node.js 版本管理器」里装 22。
3. **拉代码**（代码在公开仓库 `timye9527/AI-lab-for-tim` 里，不需要 Deploy key）：
   ```bash
   sudo mkdir -p /srv && sudo chown $USER /srv && cd /srv
   git clone -b claude/xiaohongshu-e01-production-gd18aa https://github.com/timye9527/AI-lab-for-tim.git make-money-test
   cd make-money-test
   ```
   分支合并到 main 之后，把 `-b` 后面换成 `main`。
4. **启动服务**（开机自启、挂了自动重启）：
   ```bash
   sudo mkdir -p data codes backup && sudo chown -R www-data:www-data data codes backup
   sudo cp deploy/make-money-test.service /etc/systemd/system/
   sudo systemctl enable --now make-money-test
   curl http://127.0.0.1:8788/healthz        # 输出 ok 就对了
   ```
   目录不是 `/srv/make-money-test` 的话，先改 service 文件里的 `WorkingDirectory` 和 `DB_PATH`。
5. **配 HTTPS**，二选一：
   - **服务器是干净的**：装 Caddy（证书自动申请），把 `deploy/Caddyfile` 里的域名改成你的，放到 `/etc/caddy/Caddyfile`，然后运行 `sudo systemctl reload caddy`。
     ```bash
     sudo apt install -y caddy
     ```
   - **已经装了宝塔 / nginx**：按 `deploy/nginx.conf` 里的说明，加一个反向代理到 `http://127.0.0.1:8788`，再申请 SSL。
6. **设一个快捷命令 `mm`**，以后所有管理操作都用它：
   ```bash
   echo "alias mm='cd /srv/make-money-test && sudo -u www-data DB_PATH=data/app.db node --no-warnings server/admin.mjs'" >> ~/.bashrc
   source ~/.bashrc
   mm                       # 显示所有管理命令
   ```
   **建统一兑换码**（推荐，和店铺固定发货文案配合，所有买家同一个码）：
   ```bash
   mm add 你自己定的码 jiucai
   ```
   码泄露了：`mm revoke 旧码` 再 `mm add 新码 jiucai`，同步改店铺发货说明。
   如果店铺支持卡密库存、想一人一码：`mm gen jiucai 300 --prefix JC --max 3`，把 `codes/` 下的 CSV 上传到卡券库存（**这个文件不要外传**），并把 `config.js` 里 `shop.delivery` 改成 `'cards'`。
7. **每天自动备份**：运行 `sudo crontab -e`，加一行：
   ```
   0 4 * * * cd /srv/make-money-test && sudo -u www-data DB_PATH=data/app.db node --no-warnings server/admin.mjs backup
   ```
8. **在大陆实测**：用你的手机分别在 4G 和 Wi-Fi 下打开 `https://你的域名/jiucai/`，三种方式都要试：手机浏览器、微信里、小红书私信里复制再打开。
   - [ ] 都能打开、速度可以接受 → 把域名告诉主理人
   - [ ] 有打不开的 → 截图发给主理人

以后更新代码，只需要：`cd /srv/make-money-test && bash deploy/update.sh`

## C. 账号和店铺（第 1～3 周）

- [ ] 账号开通**专业号**，身份选「个人」，领域选「心理 / 测试 / 娱乐」一类，**不要选财经、理财**。
- [ ] 昵称和简介里带上品牌词「韭菜段位测试」，方便别人搜到。简介里不写微信、不写网址。
- [ ] 先按主理人给的素材发笔记**养号 1～2 周**（每天 1 篇，见 D 节）。注册满 30 天后开通「个人售卖」（或者按客服回复走店铺）。
- [ ] **上架商品**，素材在 `out/notes/jiucai/商品素材/`，主理人生成好发给你：
  - 主图、详情图：用 `01.png`～`04.png`；
  - 标题、价格、详情文案、自动发货模板：都在 `上架文案.txt` 里，直接复制；
  - 发货方式选**无需物流 / 虚拟发货**，按客服教的方法把兑换码 CSV 上传为卡券库存，开启**自动发货**。
- [ ] 自己下单买一次，走完「收到码 → 打开网页 → 输码解锁」全流程，没问题再挂到笔记上。

## D. 日常运营（每天 10 分钟）

| 什么时候 | 做什么 |
|---|---|
| 每天 | 发 1 篇笔记（素材在 `out/notes/jiucai/` 各个文件夹，图片按 01、02… 的顺序上传，文案复制 `文案.txt`），挂上商品卡 |
| 每天 | 回复私信，用 `上架文案.txt` 里的客服快捷回复 |
| 每周一 | 运行 `mm stats` 看数据，**截图发给主理人** |
| 库存少于 50 时（`mm stats` 会提醒） | 运行 `mm gen jiucai 300 --prefix JC --max 3`，把新的 CSV 追加上传到卡券库存 |

### 客服常用命令

```bash
mm check JC-XXXX-XXXX     # 查一个码用了几次
mm extend JC-XXXX-XXXX    # 买家换手机次数用完了，给他加 1 次
mm revoke JC-XXXX-XXXX    # 退款前先作废这个码
```

### 绝对不要做

- 笔记、评论、私信里**不发**微信号、网址、二维码，也不提其他平台（违规最重会永久封号）。
- **不发**任何具体股票、基金、点位、涨跌判断、收益或持仓截图。
- 不改测试网址和兑换码的格式（改了要同步告诉主理人）。
