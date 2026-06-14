# Deploying Amazon Neighborhood to AWS (Free Tier)

This project deploys as a static site using **S3 + CloudFront** — fully within AWS Free Tier limits.

## Free Tier Coverage

| Service | Free Tier Allowance |
|---------|-------------------|
| S3 | 5 GB storage, 20,000 GET requests/month |
| CloudFront | 1 TB data transfer, 10M requests/month (12 months) |

## Prerequisites

1. **AWS Account** with Free Tier active
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, region (us-east-1)
   ```
3. **Node.js 18+** installed

## Quick Deploy (Local)

From the `amazon-neighborhood` folder:

```powershell
# Windows PowerShell
.\deploy.ps1
```

Or manually:

```bash
# 1. Build the app
npm install
npm run build

# 2. Deploy infrastructure
cd infra
npm install
npx cdk bootstrap   # First time only
npx cdk deploy --require-approval never
```

After deployment, the terminal will show your site URL (a CloudFront `*.cloudfront.net` domain).

## CI/CD Deploy (GitHub Actions)

The workflow at `.github/workflows/deploy.yml` auto-deploys on push to `main`.

### Required GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions, and add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_GROQ_API_KEY` | Groq API key |
| `VITE_HF_API_KEY` | Hugging Face API key |
| `VITE_ELEVEN_LABS_API_KEY` | ElevenLabs API key |
| `VITE_SERP_API_KEY` | SerpAPI key |

## IAM Permissions Needed

Create an IAM user with these managed policies:
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AWSCloudFormationFullAccess`
- `IAMFullAccess` (needed for CDK bootstrap)

Or use the more restrictive inline policy — see AWS CDK docs.

## Tear Down

To remove all AWS resources and stop any charges:

```bash
cd infra
npx cdk destroy --force
```

## Custom Domain (Optional)

To use your own domain:
1. Register/transfer domain in Route 53 (or use existing)
2. Request an ACM certificate in `us-east-1`
3. Add `domainNames` and `certificate` to the CloudFront distribution in `infra/lib/stack.ts`

## Architecture

```
User → CloudFront (CDN + HTTPS) → S3 (private bucket)
         ↓
   React SPA (Vite build)
         ↓
   Supabase (Auth + DB) / Groq / HuggingFace APIs
```
