export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose dark:prose-invert">
        <p className="text-muted-foreground mb-4">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using the Roblox Trading Marketplace, you accept and agree to be bound by these Terms of Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Eligibility</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>You must be at least 13 years old (or the minimum age in your jurisdiction)</li>
            <li>You must have a valid Roblox account</li>
            <li>You must comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">User Conduct</h2>
          <p className="text-muted-foreground mb-2">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Post false, misleading, or fraudulent trade listings</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any Roblox Terms of Service</li>
            <li>Use the platform for any illegal activities</li>
            <li>Attempt to exploit or hack the platform</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Trading and Transactions</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>All trades are conducted at your own risk</li>
            <li>We are not responsible for disputes between traders</li>
            <li>You are responsible for verifying the legitimacy of trade offers</li>
            <li>We reserve the right to remove suspicious or fraudulent listings</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            The platform is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the modified terms.
          </p>
        </section>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a placeholder terms of service for local development and testing purposes. 
            For production use, please consult with a legal professional to create comprehensive terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}

