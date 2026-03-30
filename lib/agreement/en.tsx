export default function AgreementENContent() {
  return (
    <div className="font-prompt">
      <p>
        Welcome to the CRM membership system for point accumulation, reward redemption, and various privileges. To ensure efficient service, please read and accept the following terms and conditions:
      </p>

      <h3 className="font-bold mt-4">1. Membership Registration</h3>
      <p>
        By using the system, you agree to provide the following basic personal information to the service provider:
      </p>
      <ul className="list-disc pl-10">
        <li>Full name</li>
        <li>Phone number</li>
        <li>Email address</li>
        <li>Month/Year of birth</li>
        <li>Gender</li>
        <li>
          Delivery address for products, rewards, coupons, and other membership benefits
        </li>
        <li>Province or area</li>
        <li>
          Other information that may be necessary for identification and providing benefits
        </li>
      </ul>

      <h3 className="font-bold mt-4">
        2. Purpose of Data Collection and Use
      </h3>
      <p>
        The service provider will use your information for the following purposes:
      </p>
      <ul className="list-disc pl-10">
        <li>
          To verify your identity and manage point accumulation/redemption
        </li>
        <li>
          To facilitate reward redemption, discount coupons, and other membership benefits
        </li>
        <li>
          To communicate, provide updates, and offer promotions tailored to your interests
        </li>
        <li>
          For marketing purposes and delivering personalized benefits
        </li>
      </ul>

      <h3 className="font-bold mt-4">
        3. Data Sharing within Business Group (Data Sharing)
      </h3>
      <p>
        You acknowledge and consent that the service provider may share your personal data with Ampol Food Group and its affiliates or related companies for purposes of data analysis, market research, and integrated marketing activities, in order to provide you with better benefits and offers across all affiliated businesses.
      </p>

      <h3 className="font-bold mt-4">
        4. Personal Data Protection (PDPA)
      </h3>
      <ul className="list-disc pl-10">
        <li>
          The service provider will keep your information confidential and implement appropriate security measures.
        </li>
        <li>
          You have the right to request access, correction, or withdrawal of consent for data collection and marketing communications at any time through the designated channels.
        </li>
      </ul>

      <h3 className="font-bold mt-4">
        5. Third-Party Account Integration (Third-Party Providers)
      </h3>
      <p>
        To enhance convenience, you may choose to link your membership account with third-party providers as follows:
      </p>
      <ul className="list-disc pl-10">
        <li>
          Supported channels: LINE Official Account (LINE OA), Google Account, and Facebook Account
        </li>
        <li>
          To enable fast and secure login without needing to remember a new password
        </li>
        <li>
          To receive updates on point accumulation, redemption confirmations, discount coupons, and other benefits via the connected channels (e.g., LINE notifications)
        </li>
        <li>
          The service provider will receive only the basic information you have consented to share with those providers (e.g., profile name, profile picture, and email). You may unlink your account at any time through your membership settings or directly with the respective provider.
        </li>
      </ul>

      <h3 className="font-bold mt-4">6. Changes to Terms</h3>
      <p>
        The service provider reserves the right to modify the terms of service, benefits, and reward items. Any changes will be communicated in advance through the system's announcement channels.
      </p>
    </div>
  );
}