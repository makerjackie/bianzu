---
name: create-bianzu-image
description: >
  用用户头像生成滑动变祖器（bianzu）六档肖像、昵称、档案，并输出可分享的 HTML 页面。
  Use when the user uploads a face and wants 变祖/变组头像, 小南到神,
  自定义滑动变祖器, create-bianzu-image, or runs /create-bianzu-image.
  Install: npx skills add makerjackie/bianzu
---

# create-bianzu-image

One face photo + a name + what they do → 6 rank portraits + a sliding-ancestor page.

Works in **Grok / Claude / Codex / Cursor** or any agent that can image-edit a photo. If the host has no image-edit tool, stop and say so.

## Collect

Need all four. Missing any? Ask once, then go.

1. Face photo. User upload. Never text-to-image a named real person.
2. Display name (they said MakerJackie → write **MakerJackie**, not a cute rewrite) + a short stem for nicknames (Jackie / 梁 / 马).
3. What they do + a one-line background (独立开发者 / 设计师 / …). This is the joke engine.
4. Current vibe: rank 0–5 they are NOW. Broke / 0 收入 / 跳票 → `0`. 欠债催款 → `1`. 普通人 → `2`. Default `0`.

## Nicknames

| i | file | zh | en |
| --- | --- | --- | --- |
| 0 | `00-nan.webp` | 小难{stem} | Delayed {En} |
| 1 | `02-lao.webp` | 牢{stem} | Jailed {En} |
| 2 | `03-zi.webp` | {stem}子 | {En} |
| 3 | `04-saint.webp` | {stem}圣 | Saint {En} |
| 4 | `05-god.webp` | {stem}神 | God {En} |
| 5 | `06-ancestor.webp` | {stem}祖 | Ancestor {En} |

Display name on the roster ≠ stem. Example: roster `MakerJackie`, ranks `小难Jackie` / `Jackie圣`. Do not invent 杰基 if they said MakerJackie.

## Face is a remix of the upload, not a new person

This is **二创**：edit the user's photograph. It is not "draw someone who looks like them."

Wrong: invent a handsome stranger, then dress him.
Wrong: freeze the upload's expression and head angle on all 6 ranks.
Right: square-crop the upload with code (`magick`), then `image_edit` **that file** for every rank. Identity stays. Pose, expression, and head turn **must change**.

Rules:

1. Grok: `image_edit` the upload. Never `image_gen`. Same for other hosts: image-to-image only.
2. Square with **code**, not the model.
3. Likeness = bone structure, glasses, hairline, nose, mouth. Not the same snapshot.
4. Each rank gets a **new** head direction and expression. Chin down, look at camera, look up, 3/4 left, 3/4 right — mix them. Six ranks with the same side-glance = fail.
5. No "more handsome generic oil portrait." A different person is a fail.
6. Every rank's source is the **cropped user photo**, not a previous generated rank (except a one-step retry of that same rank).

小难/牢可以惨。惨的是表情和气色，还是这个人。

## Visual contract

Shared: square 1:1, chest-up, same identity, no text/logos.

| i | body | head / expression | clothes | backdrop |
| --- | --- | --- | --- | --- |
| 0 | 瘦小、缩肩 | 低头、视线下垂、可怜疲惫 | 肥大洗旧连帽衫 | 雨夜湿沥青、灯箱 |
| 1 | 更瘦 | 略仰头看灯、呆滞、油光 | 橙红囚衣 | 牢房铁栏 |
| 2 | 正常 | 微侧或对镜、浅笑、日常 | 休闲衬衫 | 出租屋/咖啡馆 |
| 3 | 稍壮 | 正面平视、沉静 | 黑唐装、红盘扣、金晕 | 暗金底 |
| 4 | 明显更壮 | 微扬下巴、凌厉自信 | 黑金龙纹袍（合身立领） | 雷云金电 |
| 5 | 最壮、帝王肩 | 正面俯视观者、冷威 | 冕旒 + 黑金龙袍 | 金龙圆盘 |

Each prompt: 2–5 sentences. Lead with `Same person as this photo — same glasses, bone structure, hair.` Then the new head turn, new expression, then clothes and backdrop.

## Generate

In one turn, fire **6 parallel** `image_edit` calls, each sourced from the **cropped user photo**. Do not serialize. Do not chain through a generated lock. Child agents often cannot call image tools — parallel tool calls on the main agent are the speed path.

## Verify

Put the original photo next to each rank. If a friend would not say "that's them," the rank failed. Glasses thickness, eye shape, nose, mouth, hairline must match the upload — not a handsome cousin. Retry that rank only, max 2, still from the cropped upload.

## Story

Invent a funny dossier: short, mean, specific numbers, 评论区.

| rank | joke |
| --- | --- |
| 0 小难 | 0 收入 / 跳票 / 没人用 |
| 1 牢 | 负收入、欠云账单、房东催 |
| 2 子 | 还在干这行，不好不坏 |
| 3 圣 | 产品真上线，有人付费 |
| 4 神 | 年收入炸、出圈 |
| 5 祖 | 公司卖掉 / 这行跟他姓 |

`ranks[].event` = one beat. Sliding up is the future they wish were true. `timeline` = 5–8 dated rows, past + now. Mark the now-row `now: true`. Do not date future glory unless `current` is already that high.

## Ship

**Repo mode** if `src/subjects.js` exports `SUBJECTS` and `public/ranks/` exists (this bianzu site):

```
public/ranks/{id}/{file}
```

```bash
cwebp -q 86 "$SRC" -o "public/ranks/{id}/{file}"
```

Append the subject **last** in `SUBJECTS`. `id` = ascii slug. `current` = the now-rank. Optional voices: `public/sfx/{id}/{zh|en}-{0-5}.mp3`.

**Standalone mode** otherwise:

1. Copy [template.html](template.html) to `bianzu-{id}/index.html`
2. Write the 6 webps to `bianzu-{id}/ranks/`
3. Replace the `SUBJECT` object at the top of the HTML
4. Open the file. One folder = one shareable 滑动变祖器.

Do not deploy unless asked.
