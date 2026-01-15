/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlifyデプロイ用の設定
  output: 'standalone', // Netlifyプラグインが自動的に処理
  // 環境変数の検証をビルド時にスキップ（実行時にチェック）
  env: {
    // 環境変数は実行時に読み込まれるため、ここでは定義しない
  },
  // 型チェックをビルド時にスキップ（CI/CDで別途実行）
  typescript: {
    // 本番ビルド時に型エラーがあってもビルドを続行（Netlifyでエラーを防ぐ）
    ignoreBuildErrors: false, // 型エラーは修正すべきだが、一時的にtrueにすることも可能
  },
  // ESLintエラーをビルド時にスキップ（CI/CDで別途実行）
  eslint: {
    // 本番ビルド時にESLintエラーがあってもビルドを続行
    ignoreDuringBuilds: false, // ESLintエラーは修正すべきだが、一時的にtrueにすることも可能
  },
};

module.exports = nextConfig;


