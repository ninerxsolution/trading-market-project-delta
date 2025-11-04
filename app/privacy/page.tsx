export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert">
        <p className="text-muted-foreground mb-4">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Overview</h2>
          <p className="text-muted-foreground">
            This privacy policy describes how our Roblox Trading Marketplace collects, uses, and protects your information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Roblox user ID and username</li>
            <li>Profile information from your Roblox account</li>
            <li>Trade listings and messages you create</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>To provide and improve our trading marketplace services</li>
            <li>To authenticate and identify users</li>
            <li>To facilitate trades and communications between users</li>
            <li>To ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about this privacy policy, please contact us through the Roblox Developer Forum.
          </p>
        </section>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a placeholder privacy policy for local development and testing purposes. 
            For production use, please consult with a legal professional to create a comprehensive privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

