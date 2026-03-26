export default function CancelConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="panel-subtle mx-4 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-fg">동기화를 중지할까요?</h3>
        <p className="mt-2 text-sm leading-6 text-fg-muted">
          현재 진행 중인 동기화가 다음 항목 처리 전에 중단됩니다. 이미 처리된 항목은 유지됩니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="secondary-button">계속 진행</button>
          <button type="button" onClick={onConfirm} className="primary-button" style={{ background: 'var(--c-err)' }}>중지</button>
        </div>
      </div>
    </div>
  )
}
