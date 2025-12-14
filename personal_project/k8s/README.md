```
minikube start --driver=docker --apiserver-ips=<IP-adress> --listen-address=0.0.0.0 --ports=0.0.0.0:8443:8443

kubectl create namespace <namespace-name>