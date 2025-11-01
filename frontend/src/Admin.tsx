import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Admin.css'
import { getApiBase, setApiBase } from './apiBase'

type UserAccount = {
  id: string
  name: string
  email: string
  phone: string
  password: string
}

type EditableUserFields = Omit<UserAccount, 'id'>

const defaultPrompt = `You are an AI support assistant for AI Auto Mail System.
- Always produce polite, empathetic business email responses.
- Reference knowledge snippets provided in the context with bullet points.
- Preserve important numbers, prices, deadlines, and policy names.
- When information is missing, flag the gap and request clarification instead of guessing.`

function Admin() {
  const [geminiKey, setGeminiKey] = useState('AIza...')
  const [autoSendThreshold, setAutoSendThreshold] = useState(0.78)
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt)
  const [fallbackPrompt, setFallbackPrompt] = useState(
    'If the model confidence is low, generate a short acknowledgement asking a human operator to follow up.'
  )
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [newUser, setNewUser] = useState<EditableUserFields>({
    name: '',
    email: '',
    phone: '',
    password: ''
  })
  const [status, setStatus] = useState('')
  const [apiEndpoint, setApiEndpoint] = useState(() => getApiBase())
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'newUser'>('system')
  const [searchName, setSearchName] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
  const [isModalPasswordVisible, setIsModalPasswordVisible] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setApiEndpoint(detail)
    }
    window.addEventListener('api-base-changed', handler)
    return () => window.removeEventListener('api-base-changed', handler)
  }, [])

  const buildApiUrl = (action?: string, extraParams: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      origin: window.location.origin,
      v: Date.now().toString(),
      ...extraParams
    })
    if (action) params.set('action', action)
    return `${apiEndpoint}?${params.toString()}`
  }


  const handleSelectedUserChange = <K extends keyof UserAccount>(
    field: K,
    value: UserAccount[K]
  ) => {
    setSelectedUser((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleAddUser = async () => {
    const name = newUser.name.trim()
    const email = newUser.email.trim()
    const phone = newUser.phone.trim()
    const password = newUser.password

    if (!name || !email || !password) {
      setStatus('氏名・メールアドレス・パスワードは必須です。')
      return
    }

    const provisionalId = `user-${Date.now()}`
    const payload = {
      action: 'createUser',
      origin: window.location.origin,
      user: {
        id: provisionalId,
        name,
        email,
        phone,
        password
      }
    }

    try {
      setStatus('アカウントを追加中...')
      const res = await fetch(buildApiUrl('createUser'), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload),
        credentials: 'omit'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'ユーザー追加に失敗しました')
      }
      const savedId: string = data?.id || provisionalId
      const createdUser: UserAccount = {
        id: savedId,
        name,
        email,
        phone,
        password
      }
      setUserAccounts((prev) => [...prev, createdUser])
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: ''
      })
      setStatus('ユーザーを追加しました。')
      setActiveTab('users')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  const normalizePhoneForSearch = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('0')) {
      return digits.length > 1 ? digits.slice(1) : ''
    }
    return digits
  }

  const handleSearchUsers = async () => {
    if (!searchName.trim() && !searchEmail.trim() && !searchPhone.trim()) {
      setStatus('検索条件を入力してください。')
      return
    }
    try {
      setIsSearching(true)
      setStatus('検索中...')
      const payload = {
        action: 'searchUsers',
        origin: window.location.origin,
        name: searchName.trim(),
        email: searchEmail.trim(),
        phone: normalizePhoneForSearch(searchPhone)
      }
      const res = await fetch(buildApiUrl('searchUsers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload),
        credentials: 'omit'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'ユーザー検索に失敗しました')
      }
      const users: UserAccount[] = Array.isArray(data?.users)
        ? data.users.map((entry: Partial<UserAccount>) => ({
            id: entry.id ?? `user-${Math.random().toString(36).slice(2)}`,
            name: entry.name ?? '',
            email: entry.email ?? '',
            phone: entry.phone ?? '',
            password: entry.password ?? ''
          }))
        : []
      setUserAccounts(users)
      setSelectedUser(null)
      setIsModalPasswordVisible(false)
      setStatus(users.length ? `${users.length} 件のユーザーが見つかりました。` : '該当するユーザーはありません。')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = async () => {
    try {
      setStatus('保存中...')
      const payload = {
        accounts: userAccounts,
        geminiKey,
        autoSendThreshold,
        systemPrompt,
        fallbackPrompt
      }

      const res = await fetch(buildApiUrl('saveSettings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'saveSettings',
          origin: window.location.origin,
          ...payload
        }),
        credentials: 'omit'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '保存に失敗しました')
      setStatus('管理設定を保存しました。')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  const handleApiEndpointSave = () => {
    const trimmed = apiEndpoint.trim()
    if (!trimmed) {
      setStatus('GAS エンドポイントを入力してください。')
      return
    }
    setApiBase(trimmed)
    setStatus('GAS エンドポイントを更新しました。')
  }

  const handleUpdateUser = async (user: UserAccount) => {
    if (!user.name.trim() || !user.email.trim() || !user.password) {
      setStatus('氏名・メールアドレス・パスワードは必須です。')
      return
    }
    try {
      setStatus('ユーザー情報を保存中...')
      const normalizedUser: UserAccount = {
        id: user.id,
        name: user.name.trim(),
        email: user.email.trim(),
        phone: user.phone.trim(),
        password: user.password
      }
      const payload = {
        action: 'createUser',
        origin: window.location.origin,
        user: normalizedUser
      }
      const res = await fetch(buildApiUrl('createUser'), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload),
        credentials: 'omit'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'ユーザーの保存に失敗しました')
      }
      setUserAccounts((prev) =>
        prev.map((entry) => (entry.id === normalizedUser.id ? { ...normalizedUser } : entry))
      )
      setSelectedUser({ ...normalizedUser })
      setStatus('ユーザー情報を保存しました。')
      setSelectedUser(null)
      setIsModalPasswordVisible(false)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  const toggleModalPasswordVisibility = () => {
    setIsModalPasswordVisible((prev) => !prev)
  }

  const closeUserModal = () => {
    setSelectedUser(null)
    setIsModalPasswordVisible(false)
  }

  const handleModalSave = async () => {
    if (selectedUser) {
      await handleUpdateUser(selectedUser)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-branding">
          <div className="logo-dot" aria-hidden />
          <div>
            <p className="admin-title">AI Auto Mail System</p>
            <h1>Admin Console</h1>
          </div>
        </div>
        <Link to="/" className="back-link">
          ← 運用画面へ戻る
        </Link>
      </header>

      <main className="admin-content">
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'system'}
            className={`admin-tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            システム設定
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            className={`admin-tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            ユーザー管理
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'newUser'}
            className={`admin-tab-button ${activeTab === 'newUser' ? 'active' : ''}`}
            onClick={() => setActiveTab('newUser')}
          >
            アカウント追加
          </button>
        </div>

        <div className={`admin-panels ${activeTab === 'system' ? '' : 'admin-panels--single'}`}>
          {activeTab === 'system' ? (
            <>
              <section className="admin-card">
                <h2>Gemini API 設定</h2>
                <label className="admin-field">
                  <span>Gemini API キー</span>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(event) => setGeminiKey(event.target.value)}
                    placeholder="AIza..."
                  />
                </label>
                <label className="admin-field">
                  <span>自動送信の信頼度しきい値</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={autoSendThreshold}
                    onChange={(event) => setAutoSendThreshold(Number(event.target.value))}
                  />
                  <small>値を超えたドラフトのみ自動送信モードへ流します。</small>
                </label>
                <label className="admin-field">
                  <span>GAS エンドポイント URL</span>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(event) => setApiEndpoint(event.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  <small>バックエンドの Apps Script ウェブアプリ URL（/exec まで）を入力してください。</small>
                </label>
                <button type="button" className="ghost" onClick={handleApiEndpointSave}>
                  GAS エンドポイントを更新
                </button>
              </section>

              <section className="admin-card">
                <h2>プロンプト管理</h2>
                <label className="admin-field">
                  <span>システムプロンプト</span>
                  <textarea
                    value={systemPrompt}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    rows={10}
                  />
                  <small>全返信に共通するルールやトーンを記載します。</small>
                </label>
                <label className="admin-field">
                  <span>フォールバックプロンプト</span>
                  <textarea
                    value={fallbackPrompt}
                    onChange={(event) => setFallbackPrompt(event.target.value)}
                    rows={6}
                  />
                  <small>低信頼時やナレッジ欠如時に利用する代替プロンプト。</small>
                </label>
              </section>
            </>
          ) : activeTab === 'users' ? (
            <section className="admin-card">
              <h2>ユーザー管理</h2>
              <p className="admin-tab-description">
                GAS エンドポイントで指定したスプレッドシート内の AdminAccounts / User シートと同期します。
              </p>
              <div className="user-search">
                <div className="user-search-grid">
                  <label className="admin-field">
                    <span>氏名で検索</span>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(event) => setSearchName(event.target.value)}
                      placeholder="例: 山田 太郎"
                    />
                  </label>
                  <label className="admin-field">
                    <span>メールアドレスで検索</span>
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(event) => setSearchEmail(event.target.value)}
                      placeholder="example@example.com"
                    />
                  </label>
                  <label className="admin-field">
                    <span>電話番号で検索</span>
                    <input
                      type="tel"
                      value={searchPhone}
                      onChange={(event) => setSearchPhone(event.target.value)}
                      placeholder="03-1234-5678"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="primary search-button"
                  onClick={handleSearchUsers}
                  disabled={isSearching}
                >
                  {isSearching ? '検索中…' : '検索'}
                </button>
              </div>

              <div className="user-results">
                {userAccounts.map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    className="user-row"
                    onClick={() => {
                      setSelectedUser({ ...account })
                      setIsModalPasswordVisible(false)
                    }}
                  >
                    <div className="user-row-main">
                      <span className="user-row-name">{account.name || '氏名未設定'}</span>
                      <span className="user-row-email">{account.email || 'メール未設定'}</span>
                    </div>
                    <div className="user-row-meta">
                      {account.phone ? account.phone : '電話番号未設定'}
                    </div>
                  </button>
                ))}
                {userAccounts.length === 0 && (
                  <p className="empty-state">検索結果はありません。</p>
                )}
              </div>
            </section>
          ) : (
            <section className="admin-card">
              <h2>アカウント追加</h2>
              <p className="admin-tab-description">
                入力内容は即座に GAS の User シートへ保存され、ユーザー管理タブにも反映されます。
              </p>
              <div className="account-grid">
                <label className="admin-field">
                  <span>氏名</span>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>メールアドレス</span>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>電話番号</span>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>パスワード</span>
                  <input
                    type={isNewPasswordVisible ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => setIsNewPasswordVisible((prev) => !prev)}
                  >
                    {isNewPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示する'}
                  </button>
                </label>
              </div>
              <button type="button" className="primary add-account" onClick={handleAddUser}>
                アカウントを追加
              </button>
            </section>
          )}
        </div>
      </main>

      {selectedUser && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-backdrop" onClick={closeUserModal} />
          <div
            className="admin-modal-content"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-modal-header">
              <h3>ユーザー情報を編集</h3>
              <button type="button" className="ghost small" onClick={closeUserModal}>
                閉じる
              </button>
            </header>
            <div className="admin-modal-body">
              <label className="admin-field">
                <span>氏名</span>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(event) => handleSelectedUserChange('name', event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>メールアドレス</span>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(event) => handleSelectedUserChange('email', event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>電話番号</span>
                <input
                  type="tel"
                  value={selectedUser.phone}
                  onChange={(event) => handleSelectedUserChange('phone', event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>パスワード</span>
                <input
                  type={isModalPasswordVisible ? 'text' : 'password'}
                  value={selectedUser.password}
                  onChange={(event) => handleSelectedUserChange('password', event.target.value)}
                />
                <button
                  type="button"
                  className="ghost small"
                  onClick={toggleModalPasswordVisibility}
                >
                  {isModalPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示する'}
                </button>
              </label>
            </div>
            <footer className="admin-modal-actions">
              <button type="button" className="ghost" onClick={closeUserModal}>
                キャンセル
              </button>
              <button type="button" className="primary" onClick={handleModalSave}>
                保存
              </button>
            </footer>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        <div className="status" aria-live="polite">
          {status}
        </div>
        <button type="button" className="primary" onClick={handleSave}>
          設定を保存
        </button>
      </footer>
    </div>
  )
}

export default Admin
