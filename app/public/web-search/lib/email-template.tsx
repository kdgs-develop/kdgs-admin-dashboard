import * as React from "react";

interface EmailTemplateProps {
  customerName: string;
  obituaryReference: string;
  fileUrls: string[];
}

export function EmailTemplate({
  customerName,
  obituaryReference,
  fileUrls
}: EmailTemplateProps) {
  return (
    <div>
      <h1>Thank you for your purchase!</h1>
      <p>Hello {customerName},</p>
      <p>
        Thank you for requesting the obituary with reference:{" "}
        <strong>{obituaryReference}</strong>. Below are links to download the
        requested files:
      </p>

      <ul>
        {fileUrls.map((url, i) => (
          <li key={i}>
            <a href={url}>Download File {i + 1}</a>
          </li>
        ))}
      </ul>

      <p>
        These links will be available for the next 24 hours. Please download
        your files within this time frame.
      </p>

      <p>
        If you have any questions or issues accessing the files, please contact
        us at <a href="mailto:support@kdgs.org">support@kdgs.org</a>.
      </p>

      <div>
        <p>Thank you,</p>
        <p>KDGS Obituary Database</p>
      </div>
    </div>
  );
}
