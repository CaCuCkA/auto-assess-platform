import com.synopsys.arc.jenkins.plugins.lockableresources.LockableResourcesManager
import com.synopsys.arc.jenkins.plugins.lockableresources.LockableResource

def lockName = 'docker-build-lock'

def manager = LockableResourcesManager.get()

def existingLock = manager.fromName(lockName)
if (existingLock == null) {
    println "Creating new lockable resource: '${lockName}'"
    def newLock = new LockableResource(lockName)
    manager.resources.add(newLock)
    manager.save()
} else {
    println "Lockable resource '${lockName}' already exists. Skipping creation."
}
