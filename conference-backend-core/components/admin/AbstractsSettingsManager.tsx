"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  Calendar, FileText, Settings, Plus, Trash2, Save, AlertCircle, 
  CheckCircle, BookOpen, List, Layout, Clock 
} from "lucide-react"
import { useToast } from "../ui/use-toast"

interface Topic {
  id: string
  name: string
  description?: string
  subtopics: Array<{ id: string; name: string }>
}

export function AbstractsSettingsManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/config')
      const data = await response.json()
      if (data.success) {
        setConfig(data.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load abstracts settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/abstracts/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Abstracts settings saved successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const addTopic = () => {
    setConfig({
      ...config,
      topics: [...(config.topics || []), {
        id: `topic-${Date.now()}`,
        name: '',
        description: '',
        subtopics: []
      }]
    })
  }

  const removeTopic = (index: number) => {
    const newTopics = [...config.topics]
    newTopics.splice(index, 1)
    setConfig({ ...config, topics: newTopics })
  }

  const updateTopic = (index: number, field: string, value: string) => {
    const newTopics = [...config.topics]
    newTopics[index] = { ...newTopics[index], [field]: value }
    setConfig({ ...config, topics: newTopics })
  }

  const addSubtopic = (topicIndex: number) => {
    const newTopics = [...config.topics]
    newTopics[topicIndex].subtopics.push({
      id: `subtopic-${Date.now()}`,
      name: ''
    })
    setConfig({ ...config, topics: newTopics })
  }

  const removeSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const newTopics = [...config.topics]
    newTopics[topicIndex].subtopics.splice(subtopicIndex, 1)
    setConfig({ ...config, topics: newTopics })
  }

  const updateSubtopic = (topicIndex: number, subtopicIndex: number, value: string) => {
    const newTopics = [...config.topics]
    newTopics[topicIndex].subtopics[subtopicIndex].name = value
    setConfig({ ...config, topics: newTopics })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Abstracts Configuration
          </CardTitle>
          <CardDescription>
            Manage abstract submission settings, topics, and guidelines
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dates" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="dates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Dates
          </TabsTrigger>
          <TabsTrigger value="topics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <List className="h-4 w-4 mr-2" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Guidelines
          </TabsTrigger>
          <TabsTrigger value="tracks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Layout className="h-4 w-4 mr-2" />
            Tracks
          </TabsTrigger>
        </TabsList>

        {/* Dates Tab */}
        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle>Submission Window</CardTitle>
              <CardDescription>Configure when users can submit abstracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                config.submissionWindow?.enabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}>
                <div>
                  <Label className="text-base font-semibold">Enable Submissions</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.submissionWindow?.enabled 
                      ? 'Submissions are currently OPEN - Users can submit abstracts' 
                      : 'Submissions are currently CLOSED - Users will see "Coming Soon"'}
                  </p>
                </div>
                <Switch
                  checked={config.submissionWindow?.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    submissionWindow: { ...config.submissionWindow, enabled: checked }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={config.submissionWindow?.start ? new Date(config.submissionWindow.start).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({
                      ...config,
                      submissionWindow: { ...config.submissionWindow, start: new Date(e.target.value).toISOString() }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={config.submissionWindow?.end ? new Date(config.submissionWindow.end).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({
                      ...config,
                      submissionWindow: { ...config.submissionWindow, end: new Date(e.target.value).toISOString() }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Current window: {config.submissionWindow?.enabled ? 'Active' : 'Inactive'} | 
                  {' '}{new Date(config.submissionWindow?.start).toLocaleDateString()} to{' '}
                  {new Date(config.submissionWindow?.end).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Topics & Subtopics</CardTitle>
                  <CardDescription>Define categories for abstract classification</CardDescription>
                </div>
                <Button onClick={addTopic} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {config.topics?.map((topic: Topic, topicIndex: number) => (
                <Card key={topic.id} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Topic Name *</Label>
                          <Input
                            value={topic.name}
                            onChange={(e) => updateTopic(topicIndex, 'name', e.target.value)}
                            placeholder="e.g., Neurology"
                            className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Description</Label>
                          <Input
                            value={topic.description || ''}
                            onChange={(e) => updateTopic(topicIndex, 'description', e.target.value)}
                            placeholder="Brief description of this topic"
                            className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTopic(topicIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Subtopics</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSubtopic(topicIndex)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Subtopic
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {topic.subtopics?.map((subtopic, subtopicIndex) => (
                          <div key={subtopic.id} className="flex items-center gap-2">
                            <Input
                              value={subtopic.name}
                              onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, e.target.value)}
                              placeholder="Subtopic name"
                              className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubtopic(topicIndex, subtopicIndex)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!config.topics || config.topics.length === 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No topics configured. Add topics to categorize abstracts.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.guidelines?.general || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    guidelines: { ...config.guidelines, general: e.target.value }
                  })}
                  rows={3}
                  placeholder="General submission guidelines visible to all users"
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Paper Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Free Paper</Label>
                  <Switch
                    checked={config.guidelines?.freePaper?.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines.freePaper, enabled: checked } 
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Word Limit</Label>
                  <Input
                    type="number"
                    value={config.guidelines?.freePaper?.wordLimit || 250}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines.freePaper, wordLimit: parseInt(e.target.value) } 
                      }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Requirements (one per line)</Label>
                  <Textarea
                    value={config.guidelines?.freePaper?.requirements?.join('\n') || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines.freePaper, requirements: e.target.value.split('\n') } 
                      }
                    })}
                    rows={5}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Enter each requirement on a new line"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Poster Presentation Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Poster</Label>
                  <Switch
                    checked={config.guidelines?.poster?.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines.poster, enabled: checked } 
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Word Limit</Label>
                  <Input
                    type="number"
                    value={config.guidelines?.poster?.wordLimit || 250}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines.poster, wordLimit: parseInt(e.target.value) } 
                      }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Requirements (one per line)</Label>
                  <Textarea
                    value={config.guidelines?.poster?.requirements?.join('\n') || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines.poster, requirements: e.target.value.split('\n') } 
                      }
                    })}
                    rows={5}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Enter each requirement on a new line"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Tracks</CardTitle>
              <CardDescription>Configure available presentation types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.tracks?.map((track: any, index: number) => (
                <div key={track.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <Label className="font-semibold">{track.label}</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{track.key}</p>
                  </div>
                  <Switch
                    checked={track.enabled}
                    onCheckedChange={(checked) => {
                      const newTracks = [...config.tracks]
                      newTracks[index].enabled = checked
                      setConfig({ ...config, tracks: newTracks })
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Ready to save changes?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">These settings will be reflected on the public abstracts page</p>
            </div>
            <Button onClick={saveConfig} disabled={saving} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
