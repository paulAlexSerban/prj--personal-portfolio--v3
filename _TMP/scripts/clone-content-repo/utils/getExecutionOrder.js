const getExecutionOrder = (tasks) => {
    const order = [];
    const visited = new Set();

    const visit = (task) => {
        if (visited.has(task.name)) return;
        visited.add(task.name);
        task.dependsOn.forEach((dep) => {
            const depTask = tasks.find((t) => t.name === dep);
            if (depTask) visit(depTask);
        });
        order.push(task);
    };

    tasks.forEach(visit);
    return order;
};

module.exports = getExecutionOrder;
