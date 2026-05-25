export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-slate-400 text-sm mb-8">Last updated: May 2026</p>

      <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 mb-1">About Stampaid</h2>
          <p>Stampaid is a payment tracking and reminder tool for independent service providers. It does not process, hold, transmit, or facilitate financial transactions of any kind. All payments between you and your clients occur outside of Stampaid.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Your responsibilities</h2>
          <p>You are responsible for the accuracy of the information you enter. Stampaid is not a party to any financial arrangement between you and your clients and is not liable for any payment disputes, missed payments, or errors arising from your use of the app.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Acceptable use</h2>
          <p>You agree to use Stampaid only for lawful purposes and in a manner consistent with these terms. We reserve the right to suspend or terminate accounts that abuse the service or violate applicable law.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Disclaimer</h2>
          <p>Stampaid is provided "as is" without warranty of any kind. We are not responsible for any loss of data or income arising from use or unavailability of the service.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Changes</h2>
          <p>These terms may be updated from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.</p>
        </section>
      </div>

      <a href="/login" className="inline-block mt-10 text-emerald-600 hover:underline text-sm">← Back to app</a>
    </div>
  )
}
