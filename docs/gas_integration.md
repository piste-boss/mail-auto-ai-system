# GAS 連携アップデート概要

フロントエンドの「アカウント追加」タブから送信される `createUser` アクションを処理し、
同一スプレッドシートの `Users` シートへ利用者情報を追記できるよう Apps Script を拡張してください。

## 追加するアクション

```js
case 'createUser': {
  if (method !== 'POST') {
    throw withStatus_(405, 'POST メソッドが必要です')
  }
  const userId = createOrUpdateUser_(payload)
  return respond_(200, { ok: true, id: userId }, origin)
}
```

## Users シートへの書き込み

```js
function createOrUpdateUser_(payload) {
  const user = payload && payload.user ? payload.user : payload
  if (!user) {
    throw withStatus_(400, 'user オブジェクトが必要です')
  }

  const name = str_(user.name || '')
  const email = str_(user.email || '')
  const password = String(user.password || '').trim()

  if (!name || !email || !password) {
    throw withStatus_(400, 'name, email, password は必須です')
  }

  const phone = str_(user.phone || '')
  let id = str_(user.id || '')
  if (!id) {
    id = Utilities.getUuid()
  }

  const ss = getSpreadsheet_()
  const sheet = getOrCreateSheet_(ss, 'Users', [
    'id',
    'name',
    'email',
    'phone',
    'password',
    'createdAt'
  ])

  const row = [id, name, email, phone, password, new Date().toISOString()]
  const lastRow = sheet.getLastRow()
  let updated = false

  if (lastRow >= 2) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    for (let index = 0; index < ids.length; index += 1) {
      if (str_(ids[index][0]) === id) {
        sheet.getRange(index + 2, 1, 1, row.length).setValues([row])
        updated = true
        break
      }
    }
  }

  if (!updated) {
    sheet.appendRow(row)
  }

  return id
}
```

## AdminAccounts シートのカラム変更

`replaceAccountRows_` のヘッダーを以下の 5 カラムへ調整し、`accounts` の `password` を保存します。

```js
const headers = ['id', 'name', 'email', 'phone', 'password']
```

## シート構成メモ

- `Users` シート: アカウント追加タブからの利用者情報を追記。カラムは `id, name, email, phone, password, createdAt`。
- `AdminAccounts` シート: 管理画面側で編集可能なスタッフ情報。パスワードカラムを追加。

これらを反映後、Netlify 側から送信される `createUser` リクエストにより、即時で `Users` シートへ行が追加されます。
