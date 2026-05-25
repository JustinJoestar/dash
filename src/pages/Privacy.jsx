export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-400 text-sm mb-8">Last updated: May 2026</p>

      <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 mb-1">What we collect</h2>
          <p>Stampaid collects only the minimum information needed to operate: your email address for authentication, and the client information you enter (names, emails, phone numbers, service details, and payment records).</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">What we never collect</h2>
          <p>We do not collect, store, or process any financial account numbers, card numbers, bank account information, routing numbers, or payment credentials of any kind. Stampaid is a record-keeping tool only — money moves outside of our platform entirely.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">How your data is used</h2>
          <p>Your data is used solely to provide the Stampaid service to you. It is never sold, rented, or shared with third parties except as required by applicable law.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Data security</h2>
          <p>Your data is stored securely with Supabase and protected by row-level security policies — meaning your clients are visible only to you.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Deletion</h2>
          <p>You may delete your account and all associated data at any time by contacting us. Deletion is permanent and irreversible.</p>
        </section>
      </div>

      <a href="/login" className="inline-block mt-10 text-emerald-600 hover:underline text-sm">← Back to app</a>
    </div>
  )
}
