pnpm install
export PORT=3008
export OPENAI_API_MODEL_DEFAULT=gpt-3.5-turbo-0613
export OPENAI_API_MODEL_3=gpt-3.5-turbo-0613
export OPENAI_API_MODEL_4=gpt-4-0613
	
export OPENAI_API_KEY=
echo 'OPENAI_API_KEY:'$OPENAI_API_KEY

export GOOGLE_API_KEY=
echo 'GOOGLE_API_KEY:'$GOOGLE_API_KEY

export BING_COOKIE=
echo 'BING_COOKIE:'$BING_COOKIE

export HTTPS_PROXY=http://127.0.0.1:8118
echo 'HTTPS_PROXY:'$HTTPS_PROXY

export CLAUDE_TOKEN=
export CLAUDE_BOT=
echo 'CLAUDE_TOKEN:'$CLAUDE_TOKEN
echo 'CLAUDE_BOT:'$CLAUDE_BOT

export BAIDU_API_KEY=
export BAIDU_SECRET_KEY=
echo 'BAIDU_API_KEY:'$BAIDU_API_KEY
echo 'BAIDU_SECRET_KEY:'$BAIDU_SECRET_KEY

export CHATGLM_API_BASE_URL=http://localhost:8000
export CHATGLM_API_MODEL_DEFAULT=chatglm2-6b
export CHATGLM_API_KEY=none
echo 'CHATGLM_API_BASE_URL:'$CHATGLM_API_BASE_URL
echo 'CHATGLM_API_MODEL_DEFAULT:'$CHATGLM_API_MODEL_DEFAULT
echo 'CHATGLM_API_KEY:'$CHATGLM_API_KEY

date=`date +%Y%m%d-%H%M%S`

mv chatgpt-nodejs.log chatgpt-nodejs.log-$date 

echo 'chatgpt-nodejs 开始启动...'
echo "" > chatgpt-nodejs.log

nohup pnpm start > chatgpt-nodejs.log 2>&1  &

#tail -f chatgpt-nodejs.log
echo '启动完毕，请检查日志chatgpt-nodejs.log'
