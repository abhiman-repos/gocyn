We building a Gocyn which is E - learning platform that Helps student to enroll in top courses introducted by top intructors 

## API configuration

Set `NEXT_PUBLIC_APP_URL` to the current API service for courses, instructors, and platform accounts. Set `NEXT_PUBLIC_LEGACY_API_URL` to the deployed legacy service that owns internship uploads and legacy certificate verification. If the legacy variable is omitted, internship requests fall back to `NEXT_PUBLIC_APP_URL` for backwards compatibility. Configure both variables in local and production environments, then redeploy so the client bundle receives the values.
