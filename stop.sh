echo "stop begin"
	
#获取端口3004占用的线程pid
pids=$(netstat -nlp | grep :3008 | awk '{print $7}' | awk -F"/" '{ print $1 }')
#循环得到的结果
for pid in $pids
	do
	 echo  $pid
#结束线程
	 kill -9  $pid
	done

echo "stop end!"
