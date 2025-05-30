# コードエディタ機能改善

## 2024-03-22: テーブル編集機能の実装

### 実装目標
1. タブ切り替えによるリッチテキストとマークダウン編集機能の連携実装
2. テーブル編集UIのポップオーバー表示とモーダル表示の実装
3. テーブル行/列の追加削除機能の実装
4. テーブルの操作に関するUIの改善

### 実施内容

#### 1. タブ間の連携処理

タブ間の状態連携実装:

```tsx
// タブ切替時の処理
useEffect(() => {
  // 前回と異なるタブの場合
  if (previousTab !== activeTab) {
    
    // リッチテキストからの切替時の処理
    if (previousTab === "richtext" && contentEditableRef.current) {
      // リッチテキストの内容取得
      const currentHTML = contentEditableRef.current.innerHTML;
      if (currentHTML !== htmlContent) {
        setHtmlContent(currentHTML);
        // マークダウンへ変換
        const markdown = convertHtmlToMarkdown(currentHTML);
        setContent(markdown);
      }
    }
    
    // マークダウンからの切替時の処理
    if (previousTab === "write") {
      // HTML変換
      const html = convertMarkdownToHtml(content);
      if (html !== htmlContent) {
        setHtmlContent(html);
      }
    }
    
    // HTMLビューからの切替時の処理
    if (previousTab === "html") {
      // マークダウン変換
      const markdown = convertHtmlToMarkdown(htmlContent);
      setContent(markdown);
    }
    
    // 前のタブを更新
    setPreviousTab(activeTab);
  }
}, [activeTab, htmlContent, content, setHtmlContent, setContent, previousTab]);
```

#### 2. テーブル編集UI関連の実装

状態管理の定義:

```tsx
// テーブル編集状態管理
const [tableSelection, setTableSelection] = useState<TableSelectionState | null>(null);
const [showTableModal, setShowTableModal] = useState(false); // モーダル表示
const [showTablePopover, setShowTablePopover] = useState(false); // ポップオーバー表示
```

ポップオーバー表示・モーダル表示実装:

```tsx
// ポップオーバー表示実装
<Popover open={showTablePopover} onOpenChange={setShowTablePopover}>
  <PopoverTrigger asChild>
    <Button>...</Button>
  </PopoverTrigger>
  <PopoverContent>
    ...
    <Button onClick={() => setShowTableModal(true)}>
      詳細設定を開く
    </Button>
    ...
  </PopoverContent>
</Popover>

// モーダルウィンドウ表示実装
{tableSelection && showTableModal && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    onClick={() => setShowTableModal(false)}
  >
    ...
  </div>
)}
```

#### 3. テーブル編集機能実装

行削除関連の実装:

```tsx
// 行の削除処理
const deleteTableRow = () => {
  if (!tableSelection) return;
  
  try {
    const { table, row } = tableSelection;
    
    // ヘッダー行は削除できない
    if (row === 0) return;
    
    // 行が 2行以下だと削除できない（ヘッダー+最低1行）
    if (table.rows.length <= 2) return;
    
    // 行を削除
    table.deleteRow(row);
    
    // 編集内容を反映させ更新
    updateRichTextContent();
    
    // 選択状態をリセット
    setTableSelection(null);
    setShowTableModal(false);
    setShowTablePopover(false);
  } catch (error) {
    console.error('行の削除で問題が発生:', error);
  }
};
```

#### 4. テーブルの操作サポート

テーブルクリックとセル選択の実装:

```tsx
// テーブル内のクリック処理とセル選択機能
const handleTableClick = (e: MouseEvent) => {
  // テーブルツールバーのクリックの場合は何もしない（イベント伝播を防ぐ）
  if ((e.target as HTMLElement).closest('.table-toolbar')) {
    return;
  }
  
  // クリック対象の要素を取得
  let target = e.target as HTMLElement;
  
  // クリックがテーブル外の場合は選択解除
  const isOutsideTable = !target.closest('table');
  if (isOutsideTable) {
    setTableSelection(null);
    setShowTablePopover(false);
    return;
  }
  
  // イベント伝播を停止 (親要素のクリック防止)
  e.stopPropagation();
  
  // クリックがセル要素（td/th）かどうか判定
  let cell: HTMLTableCellElement | null = null;
  if (target.tagName === 'TD' || target.tagName === 'TH') {
    cell = target as HTMLTableCellElement;
  } else {
    cell = target.closest('td, th') as HTMLTableCellElement;
  }
  
  // セル要素がない場合は何もしない
  if (!cell) return;
  
  // セル要素から親テーブル要素を取得
  const tableElement = cell.closest('table') as HTMLTableElement;
  if (!tableElement) return;
  
  // 行の要素を取得
  const rowElement = cell.parentElement as HTMLTableRowElement;
  if (!rowElement) return;
  
  const row = rowElement.rowIndex;
  const col = cell.cellIndex;
  
  console.log('選択されたセル情報:', { row, col });
  
  // 選択状態を更新
  setTableSelection({ table: tableElement, row, col });
  
  // ポップオーバーを表示（閉じている場合は開く）
  if (!showTablePopover) {
    setShowTablePopover(true);
  }
};
```

イベントリスナーの設定実装:

```tsx
// clickイベント登録 (リッチテキストエディタ内でのクリック処理)
contentEditableRef.current.addEventListener('click', handleTableClick);

// 外部クリックイベント登録（ドキュメント全体）
document.addEventListener('click', handleDocumentClick, { capture: true });
```

MutationObserverの実装:

```tsx
const observer = new MutationObserver((mutations) => {
  // アニメーションフレームの最適化（処理の間引き）
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  animationFrameId = requestAnimationFrame(() => {
    // DOM変更内容をチェックしテーブル関連か確認
    const tableAffected = mutations.some(mutation => {
      return mutation.target.nodeName === 'TABLE' || 
             mutation.target.closest('table') || 
             Array.from(mutation.addedNodes).some(node => 
               (node as HTMLElement).nodeName === 'TABLE' || 
               (node as HTMLElement).querySelector?.('table')
             );
    });
    
    // テーブル関連の変更でない場合は何もしない
    if (!tableAffected && mutations.length < 5) return;
    
    // テーブル関連の変更があればテーブルを走査
    if (contentEditableRef.current) {
      const tables = contentEditableRef.current.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach(table => {
          // ツールバーやハンドラの設置処理...
        });
      }
    }
  });
});
```

### 次回の課題

#### MUST
1. テーブル編集時のUndoの動作設定（現状Undoができないとテーブルが壊れる）
2. テーブルの行幅の自動調整機能
3. テーブル内の画像やリンク編集モードでの動作検証（重複削除しないよう）

#### NICE-TO-HAVE
1. テーブルのリサイズハンドル実装（列幅調整可能に）
2. テーブルのコピー＆ペースト対応
3. テーブル内のセル結合・分割機能実装
4. テーブルの書式設定（罫線種類・太さ・色等）
5. テーブルの埋め込み画像やリンクの高度な編集機能

## 2024-03-23: コードブロック表示の修正

### 実装内容
コードブロックの表示に関する以下の問題を修正：
1. 行番号の先頭に不要なシングルクオートが表示される問題
2. コードブロック内のテキストの前後にバッククオートが表示される問題
3. シンタックスハイライトが正しく表示されない問題

### 実装詳細

#### 1. 問題の特定と根本原因分析

問題の特定：
- コードブロックの行番号（1, 2, 3...）の先頭に不要なシングルクオート（`）が表示される
- コードブロックのテキスト前後に余分なバッククオート記号が含まれる

根本原因：
- 行番号の問題: フォントの合字（リガチャ）機能が原因でフォントの特性により数字にシングルクオートが付与される
- バッククオートの問題: ReactMarkdownがコードブロックをパースする際に、マークダウンの構文記号（```）も含めて処理している

#### 2. コードブロックのカスタム実装による解決

完全なカスタム実装によりバグを解消：

```tsx
// カスタム表示を行うか、ライブラリを使うか決定
// 問題がどうしても解決しない場合は true に変更してカスタム実装を使用する
const USE_CUSTOM_SOLUTION = true;

// 完全に新しいカスタム実装による行番号表示
// 行番号の問題を解消するために、行番号を自前で実装
const renderLineNumbers = () => {
  const lines = cleanValue.split('\n');
  return (
    <div 
      className="custom-line-numbers"
      style={{
        float: 'left',
        marginRight: '16px',
        textAlign: 'right',
        color: isDarkTheme ? '#666' : '#aaa',
        borderRight: isDarkTheme ? '1px solid #333' : '1px solid #eee',
        paddingRight: '12px',
        userSelect: 'none',
        fontFamily: 'Consolas, Monaco, monospace',
        // 重要: リガチャを無効化
        fontVariantLigatures: 'none !important',
        fontFeatureSettings: '"liga" 0, "calt" 0 !important'
      }}
    >
      {lines.map((_, i) => (
        <div key={i} style={{ 
          lineHeight: '1.5',
          fontVariantLigatures: 'none !important',
          fontFamily: 'Consolas, Monaco, monospace',
        }}>
          {i + 1}
        </div>
      ))}
    </div>
  );
};
```

#### 3. シンタックスハイライトの実装

Prismjsを活用した直接的なシンタックスハイライト:

```tsx
// Prismjsを直接インポート
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
// その他の必要な言語...

// コードブロック内でのハイライト処理
let highlightedCode = '';
try {
  // Prismjsで言語に応じたハイライト処理
  if (Prism.languages[normalizedLang]) {
    highlightedCode = Prism.highlight(
      cleanValue,
      Prism.languages[normalizedLang],
      normalizedLang
    );
  } else {
    // サポートされていない言語の場合はプレーンテキスト扱い
    highlightedCode = cleanValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
} catch (e) {
  console.error('Syntax highlighting error:', e);
  // エラー時は単純なエスケープ処理
  highlightedCode = cleanValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ハイライトされたコードを行単位でレンダリング
{lines.map((line, i) => (
  <div 
    key={i} 
    style={{ whiteSpace: 'pre' }}
    dangerouslySetInnerHTML={{ __html: line || ' ' }} 
  />
))}
```

#### 4. バッククオート除去のロジック強化

マークダウンのコードブロック記号の徹底的な除去:

```tsx
// マークダウンコードブロックの完全な検出と削除（あらゆるケースに対応）
let cleanValue = value;

// 最初に先頭と末尾の空白を除去
cleanValue = cleanValue.trim();

// バッククオートを厳密に処理
// 1. ```lang\n で始まるコードブロック
cleanValue = cleanValue.replace(/^```[\s\S]*?\n/, '');

// 2. ``` で終わるコードブロック
cleanValue = cleanValue.replace(/```\s*$/g, '');

// 3. 単一のバッククオート（先頭・末尾のみ）
cleanValue = cleanValue.replace(/^`|`$/g, '');

// 4. 複数のバッククオート（連続したもの）
cleanValue = cleanValue.replace(/^`+|`+$/g, '');

// 5. 特殊な非表示文字を除去
cleanValue = cleanValue
  .replace(/[\u200B-\u200D\uFEFF]/g, '') // ゼロ幅文字など
  .replace(/\u00A0/g, ' '); // ノーブレークスペース→通常スペース
```

#### 5. CSS の拡張

リガチャを徹底的に無効化するCSS：

```css
/* 行番号のシングルクオート問題対策 - 最終強化版 */
.code-block-wrapper .linenumber,
.code-block-wrapper [class*="line-number"],
.code-block-wrapper [class*="linenumber"],
.code-block-wrapper span[style*="user-select: none"],
.code-block-wrapper span[style*="min-width"],
.code-block-wrapper [class*="token-line"] > span:first-child,
.code-block-wrapper div[style*="user-select: none"] {
  /* 行番号には固定幅フォントを強制的に使用、リガチャ無効化 */
  font-family: Consolas, "Courier New", monospace !important;
  font-variant-ligatures: none !important;
  font-variant: normal !important;
  font-variant-numeric: tabular-nums !important;
  font-feature-settings: "liga" 0, "calt" 0, "tnum" 1 !important;
  -webkit-font-feature-settings: "liga" 0, "calt" 0, "tnum" 1 !important;
  -moz-font-feature-settings: "liga" 0, "calt" 0, "tnum" 1 !important;
  text-rendering: optimizeLegibility !important;
  font-synthesis: none !important;
  unicode-range: U+0030-0039; /* 数字のみに適用 */
}
```

### 次のステップと残課題

#### MUST
1. 長いコードブロックの場合のスクロールバーの挙動を改善
2. モバイル端末でのコードブロック表示の最適化
3. コードブロック内のインデントが正しく表示されない問題の調査

#### NICE-TO-HAVE
1. コードブロックのコピーボタン機能の追加
2. 行番号をクリックして行をハイライトする機能
3. 言語選択UIの改善
4. 「以下の通り修正」のような日本語説明付きコードブロックの対応
5. コードブロック内のキーワード検索ハイライト機能