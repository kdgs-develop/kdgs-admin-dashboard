import * as React from "react";

interface OrderConfirmationEmailProps {
  customerName: string;
  downloadLink: string;
  orderId: string;
  obituaryRefsList: string;
}

export const OrderConfirmationEmailTemplate: React.FC<
  Readonly<OrderConfirmationEmailProps>
> = ({ customerName, downloadLink, orderId, obituaryRefsList }) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your KDGS Obituary Record Download</title>
      <style type="text/css">
        {`
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
          table { border-collapse: collapse !important; }
          body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
          a { color: #1a73e8; }
        `}
      </style>
    </head>
    <body
      style={{
        margin: "0 !important",
        padding: "20px !important",
        backgroundColor: "#f4f4f4",
        fontFamily: "Arial, Helvetica, sans-serif"
      }}
    >
      <table border={0} cellPadding={0} cellSpacing={0} width="100%">
        <tr>
          <td align="center" style={{ backgroundColor: "#f4f4f4" }}>
            <table
              border={0}
              cellPadding={0}
              cellSpacing={0}
              width="100%"
              style={{
                maxWidth: "600px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
              }}
            >
              <tr>
                <td
                  align="center"
                  style={{
                    padding: "30px 20px 20px 20px",
                    borderBottom: "1px solid #dddddd"
                  }}
                >
                  <img
                    src="https://dashboard.kdgs.ca/kdgs.png"
                    alt="Kelowna & District Genealogical Society Logo"
                    width={200}
                    style={{
                      display: "block",
                      margin: "0 auto 20px auto",
                      maxWidth: "200px",
                      height: "auto"
                    }}
                  />
                  <h1 style={{ margin: 0, fontSize: "24px", color: "#333333" }}>
                    Kelowna & District Genealogical Society
                  </h1>
                  <p
                    style={{
                      margin: "10px 0 0 0",
                      fontSize: "18px",
                      color: "#555555"
                    }}
                  >
                    Thank You For Your Purchase!
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  align="left"
                  style={{
                    padding: "30px 30px 30px 30px",
                    color: "#555555",
                    fontSize: "16px",
                    lineHeight: 1.6
                  }}
                >
                  <p style={{ margin: "0 0 20px 0" }}>Hello {customerName},</p>
                  <p style={{ margin: "0 0 20px 0" }}>
                    Thank you for purchasing obituary records from the Kelowna &
                    District Genealogical Society (KDGS). You can access and
                    download your files using the secure link below.
                  </p>
                  <p style={{ margin: "0 0 30px 0" }}>
                    This link provides access to the records associated with
                    your recent order. Please keep this email for future
                    reference.
                  </p>
                  <table
                    border={0}
                    cellSpacing={0}
                    cellPadding={0}
                    width="100%"
                  >
                    <tr>
                      <td align="center">
                        <table border={0} cellSpacing={0} cellPadding={0}>
                          <tr>
                            <td
                              align="center"
                              style={{
                                borderRadius: "5px",
                                backgroundColor: "#1a73e8"
                              }}
                            >
                              <a
                                href={downloadLink}
                                target="_blank"
                                style={{
                                  fontSize: "16px",
                                  fontFamily: "Arial, Helvetica, sans-serif",
                                  color: "#ffffff",
                                  textDecoration: "none",
                                  borderRadius: "5px",
                                  padding: "15px 30px",
                                  border: "1px solid #1a73e8",
                                  display: "inline-block"
                                }}
                              >
                                Access Your Obituary Records
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p
                    style={{
                      margin: "30px 0 20px 0",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#888888"
                    }}
                  >
                    If the button above doesn't work, copy and paste this link
                    into your browser:
                    <br />
                    <a
                      href={downloadLink}
                      target="_blank"
                      style={{
                        color: "#1a73e8",
                        textDecoration: "underline",
                        wordBreak: "break-all"
                      }}
                    >
                      {downloadLink}
                    </a>
                  </p>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "14px",
                      color: "#888888"
                    }}
                  >
                    Purchased Record Reference(s): {obituaryRefsList}
                  </p>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "14px",
                      color: "#888888"
                    }}
                  >
                    Your Order ID: {orderId}
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  align="center"
                  style={{
                    padding: "20px 30px 30px 30px",
                    backgroundColor: "#f9f9f9",
                    borderTop: "1px solid #dddddd",
                    borderRadius: "0 0 8px 8px"
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#888888"
                    }}
                  >
                    Need help or have questions? Contact us at{" "}
                    <a href="mailto:obits@kdgs.ca" style={{ color: "#1a73e8" }}>
                      obits@kdgs.ca
                    </a>
                    .
                  </p>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#888888"
                    }}
                  >
                    Want to find more records?{" "}
                    <a
                      href="https://dashboard.kdgs.ca/public/search"
                      target="_blank"
                      style={{ color: "#1a73e8" }}
                    >
                      Search our Obituary Records page
                    </a>
                    .
                  </p>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#888888"
                    }}
                  >
                    For Society news, events, and updates, visit our main
                    website:{" "}
                    <a
                      href="https://kdgs.ca"
                      target="_blank"
                      style={{ color: "#1a73e8" }}
                    >
                      kdgs.ca
                    </a>
                    .
                  </p>
                  <p
                    style={{
                      margin: "10px 0 0 0",
                      fontSize: "12px",
                      color: "#888888"
                    }}
                  >
                    © {new Date().getFullYear()} Kelowna & District
                    Genealogical Society. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
);
